"""Blender 4.x/5.x: blender -b --python-exit-code 1 --python cycles_bake.py -- --manifest job.json"""
import argparse
import hashlib
import json
import math
import re
import sys
import time
from pathlib import Path

import bpy


def args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', required=True)
    parser.add_argument('--device', choices=['AUTO', 'CPU', 'OPTIX', 'CUDA', 'HIP', 'ONEAPI', 'METAL'], default='AUTO')
    parser.add_argument('--smoke', action='store_true', help='Create a small colored test mesh instead of importing input')
    return parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])


def choose_device(requested):
    if requested == 'CPU':
        bpy.context.scene.cycles.device = 'CPU'
        return {'backend': 'CPU', 'devices': ['CPU']}
    preferences = bpy.context.preferences.addons['cycles'].preferences
    for backend in ([requested] if requested != 'AUTO' else ['OPTIX', 'CUDA', 'HIP', 'ONEAPI', 'METAL']):
        try:
            preferences.compute_device_type = backend
            preferences.refresh_devices()
            accelerators = [d for d in preferences.devices if d.type != 'CPU']
            if accelerators:
                for device in preferences.devices:
                    device.use = device.type != 'CPU'
                bpy.context.scene.cycles.device = 'GPU'
                return {'backend': backend, 'devices': [d.name for d in accelerators]}
        except (TypeError, RuntimeError):
            continue
    if requested != 'AUTO':
        raise RuntimeError('Requested GPU backend is unavailable: ' + requested)
    bpy.context.scene.cycles.device = 'CPU'
    return {'backend': 'CPU', 'devices': ['CPU'], 'fallback': True}


def load_asset(filename):
    suffix = filename.suffix.lower()
    if suffix in ('.glb', '.gltf'):
        bpy.ops.import_scene.gltf(filepath=str(filename))
    elif suffix == '.fbx':
        bpy.ops.import_scene.fbx(filepath=str(filename))
    else:
        raise ValueError('Supported input formats: GLB, glTF, FBX')


def linear(value):
    return value / 12.92 if value <= .04045 else ((value + .055) / 1.055) ** 2.4


def color(hex_color):
    value = hex_color.lstrip('#')
    if len(value) != 6:
        raise ValueError('Colors must be #RRGGBB')
    return (*[linear(int(value[i:i + 2], 16) / 255) for i in (0, 2, 4)], 1)


def configure_material(material, spec, root):
    """Override only explicit material entries; imported node graphs otherwise survive."""
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    shader = next((n for n in nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if shader is None:
        raise ValueError('Material override needs a Principled BSDF: ' + material.name)
    for key, socket in [('baseColor', 'Base Color'), ('metallic', 'Metallic'), ('roughness', 'Roughness'), ('ior', 'IOR'), ('transmission', 'Transmission Weight'), ('alpha', 'Alpha')]:
        if key not in spec:
            continue
        target = shader.inputs.get(socket)
        if target is None:
            raise ValueError('Unsupported shader socket: ' + socket)
        for link in list(target.links):
            links.remove(link)
        target.default_value = color(spec[key]) if key == 'baseColor' else spec[key]
    for key, socket, srgb in [('baseColorMap', 'Base Color', True), ('roughnessMap', 'Roughness', False), ('metallicMap', 'Metallic', False), ('normalMap', 'Normal', False)]:
        if key not in spec:
            continue
        image = bpy.data.images.load(str((root / spec[key]).resolve()), check_existing=False)
        image.colorspace_settings.name = 'sRGB' if srgb else 'Non-Color'
        texture = nodes.new('ShaderNodeTexImage')
        texture.image = image
        uv = nodes.new('ShaderNodeUVMap')
        uv.uv_map = spec.get('uvMap', 'UV0')
        links.new(uv.outputs['UV'], texture.inputs['Vector'])
        output = texture.outputs['Color']
        if key == 'normalMap':
            normal = nodes.new('ShaderNodeNormalMap')
            links.new(output, normal.inputs['Color'])
            output = normal.outputs['Normal']
        links.new(output, shader.inputs[socket])


def prepare_uv(obj, resolution, margin):
    # Pin source textures to original UV, never silently redirect logos onto bake UV.
    original = obj.data.uv_layers.active
    if original:
        for slot in obj.material_slots:
            if not slot.material:
                continue
            tree = slot.material.node_tree
            if not tree:
                continue
            for node in list(tree.nodes):
                if node.type == 'TEX_IMAGE' and not node.inputs['Vector'].is_linked:
                    uv = tree.nodes.new('ShaderNodeUVMap')
                    uv.uv_map = original.name
                    tree.links.new(uv.outputs['UV'], node.inputs['Vector'])
    if not original:
        obj.data.uv_layers.new(name='UV0')
    layer = obj.data.uv_layers.new(name='BakeUV')
    obj.data.uv_layers.active = layer
    layer.active_render = True
    layer_name = layer.name
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=min(.1, margin * 2 / resolution))
    bpy.ops.object.mode_set(mode='OBJECT')
    return layer_name


def bake(obj, kind, output, resolution, margin):
    image = bpy.data.images.new(obj.name + '_' + kind, width=resolution, height=resolution, alpha=False, float_buffer=False)
    image.colorspace_settings.name = 'sRGB' if kind == 'baseColor' else 'Non-Color'
    targets = []
    for slot in obj.material_slots:
        tree = slot.material.node_tree
        for node in tree.nodes:
            node.select = False
        node = tree.nodes.new('ShaderNodeTexImage')
        node.image = image
        node.select = True
        tree.nodes.active = node
        targets.append((tree, node))
    try:
        options = {'use_clear': True, 'margin': margin}
        if kind == 'baseColor':
            bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, **options)
        elif kind == 'irradiance':
            bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, **options)
        elif kind == 'normal':
            bpy.ops.object.bake(type='NORMAL', normal_space='TANGENT', **options)
        elif kind == 'roughness':
            bpy.ops.object.bake(type='ROUGHNESS', **options)
        elif kind == 'ao':
            bpy.ops.object.bake(type='AO', **options)
        else:
            raise ValueError('Unsupported pass: ' + kind)
        image.filepath_raw = str(output)
        image.file_format = 'PNG'
        image.save()
    finally:
        for tree, node in targets:
            tree.nodes.remove(node)
        bpy.data.images.remove(image)


def main():
    cli = args()
    manifest_path = Path(cli.manifest).resolve()
    job = json.loads(manifest_path.read_text(encoding='utf-8-sig'))
    root = manifest_path.parent
    output = (root / job['output']).resolve()
    # Never overwrite any prior bake or source.
    output.mkdir(parents=True, exist_ok=False)
    resolution = int(job.get('resolution', 1024))
    samples = int(job.get('samples', 128))
    margin = int(job.get('margin', 16))
    if not 16 <= resolution <= 8192 or not 1 <= samples <= 3000:
        raise ValueError('Resolution: 16–8192; samples: 1–3000')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = samples
    scene.render.bake.use_selected_to_active = False
    device = choose_device(cli.device)
    if cli.smoke:
        bpy.ops.mesh.primitive_cube_add()
        material = bpy.data.materials.new('SmokePaint')
        material.use_nodes = True
        bpy.context.object.data.materials.append(material)
    else:
        load_asset((root / job['input']).resolve())
    for material in bpy.data.materials:
        material.use_nodes = True
    meshes = [o for o in scene.objects if o.type == 'MESH']
    if not meshes:
        raise ValueError('No meshes to bake')
    # Materials are per object so explicit UV references cannot affect another asset.
    source_uvs = {obj.name: obj.data.uv_layers.active.name if obj.data.uv_layers.active else 'UV0' for obj in meshes}
    for obj in meshes:
        obj.data = obj.data.copy()
        if not obj.material_slots:
            mat = bpy.data.materials.new(obj.name + '_default')
            mat.use_nodes = True
            obj.data.materials.append(mat)
        for slot in obj.material_slots:
            original_name = slot.material.name if slot.material else ''
            if not slot.material:
                slot.material = bpy.data.materials.new(obj.name + '_default')
                slot.material.use_nodes = True
            slot.material = slot.material.copy()
            if original_name in job.get('materials', {}):
                spec = dict(job['materials'][original_name])
                spec.setdefault('uvMap', obj.data.uv_layers.active.name if obj.data.uv_layers.active else 'UV0')
                configure_material(slot.material, spec, root)
    world = bpy.data.worlds.new('BakeWorld')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (1, 1, 1, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = job.get('worldStrength', .35)
    scene.world = world
    for i, config in enumerate(job.get('lights', [])):
        light = bpy.data.lights.new('BakeLight_' + str(i), 'AREA')
        light.energy = config.get('power', 1000)
        light.shape = 'DISK'
        light.size = config.get('size', 4)
        obj = bpy.data.objects.new(light.name, light)
        scene.collection.objects.link(obj)
        obj.location = config.get('position', [3, 6, 4])
        from mathutils import Vector
        obj.rotation_euler = (Vector(config.get('target', [0, 0, 0])) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    passes = job.get('passes', ['baseColor', 'roughness', 'normal', 'ao', 'irradiance'])
    report = {'schemaVersion': 1, 'blender': bpy.app.version_string, 'device': device, 'samples': samples, 'resolution': resolution, 'objects': [], 'warnings': ['Irradiance is diffuse only; metals/glass require runtime reflection/transmission.', 'UV maps are generated per mesh, not a global atlas. Maps are not automatically assigned to exported GLB.']}
    start = time.time()
    for index, obj in enumerate(meshes):
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        uv = prepare_uv(obj, resolution, margin)
        name = str(index) + '_' + re.sub(r'[^a-zA-Z0-9_-]', '_', obj.name)
        entry = {'object': obj.name, 'uvMap': uv, 'textures': {}}
        for kind in passes:
            file = output / (name + '_' + kind + '.png')
            bake(obj, kind, file, resolution, margin)
            entry['textures'][kind] = {'file': file.name, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'colorSpace': 'sRGB' if kind == 'baseColor' else 'linear'}
        report['objects'].append(entry)
    # Keep original materials; export bake UVs and maps separately for the runtime loader.
    bpy.ops.object.select_all(action='DESELECT')
    for obj in meshes:
        obj.select_set(True)
        for layer in obj.data.uv_layers:
            if layer.name == source_uvs[obj.name]:
                obj.data.uv_layers.active = layer
                layer.active_render = True
    bpy.ops.export_scene.gltf(filepath=str(output / 'model.glb'), export_format='GLB', use_selection=True)
    report['elapsedSeconds'] = round(time.time() - start, 2)
    (output / 'bake-manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('BAKE_COMPLETE ' + str(output))


if __name__ == '__main__':
    main()
