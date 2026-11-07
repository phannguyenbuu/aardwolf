import { useEffect } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';
import { gripModelNames, resolveGrips, tubeBottomCenter } from '../utils/gripPoints.js';

export default function GripPointEditor({ scene, camera, renderer, roots, controls, generation }) {
    const { adminMode, selectedPart, gizmoEnabled, gizmoMode, config3D, modelSettings, updateModelGrips, beginMoveEdit, endMoveEdit } = useConfigurator();
    useEffect(() => {
        const root = roots.current[selectedPart];
        const name = gripModelNames(config3D)[selectedPart];
        if (!adminMode || !gizmoEnabled || gizmoMode === 'rotate' || !name || !root || !scene || !camera || !renderer) return;
        const points = resolveGrips(selectedPart, config3D, modelSettings[name]?.grips);
        const bottom = ['tube', 'head'].includes(selectedPart) && tubeBottomCenter(roots.current.tube);
        if (bottom) {
            const local = root.worldToLocal(bottom.clone());
            if (selectedPart === 'tube') points.p2 = { x: local.x, y: local.y, z: local.z };
        }
        const group = new THREE.Group(); group.isStageElement = true; group.userData.isEditorHelper = true;
        const boxes = Object.entries(points).map(([key, point], index) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(65, 65, 65), new THREE.MeshBasicMaterial({ color: 0xff9900, depthTest: false, depthWrite: false, transparent: true, opacity: .5 }));
            mesh.position.copy(root.localToWorld(new THREE.Vector3(point.x, point.y, point.z)));
            mesh.userData.grip = key; mesh.renderOrder = 10001; group.add(mesh);
            const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 64;
            const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(key.toUpperCase(), 64, 48);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false }));
            sprite.scale.set(120, 60, 1); sprite.position.y = 70; mesh.add(sprite);
            return mesh;
        });
        scene.add(group);
        const highlight = selected => boxes.forEach(box => {
            box.material.color.set(0xff9900);
            box.material.opacity = .5;
            box.scale.setScalar(1);
        });
        highlight(boxes[0]);
        const tc = new TransformControls(camera, renderer.domElement); tc.setMode('translate'); tc.size = .7;
        const helper = tc.getHelper(); helper.isStageElement = true; helper.userData.isEditorHelper = true; scene.add(helper); tc.attach(boxes[0]);
        let dragging = false;
        let startPosition, inverseRoot, initialPositions;
        const affectedParts = key => {
            if (selectedPart === 'crane') return key === 'p1' ? ['pump'] : ['tube', 'head', 'suction'];
            if (selectedPart === 'tube') return key === 'p1' ? ['tube', 'head', 'suction'] : ['head', 'suction'];
            if (selectedPart === 'head') return key === 'p1' ? ['head', 'suction'] : ['suction'];
            return key === 'p1' ? [selectedPart] : [];
        };
        tc.addEventListener('objectChange', () => {
            if (!dragging || !startPosition) return;
            const delta = tc.object.position.clone().sub(startPosition);
            const factor = selectedPart !== 'crane' && tc.object.userData.grip === 'p1' ? -1 : 1;
            affectedParts(tc.object.userData.grip).forEach(part => {
                const target = roots.current[part];
                if (target && initialPositions[part]) target.position.copy(initialPositions[part]).addScaledVector(delta, factor);
            });
        });
        tc.addEventListener('dragging-changed', event => {
            dragging = event.value; controls.enabled = !dragging;
            if (dragging) {
                startPosition = tc.object.position.clone();
                root.updateMatrixWorld(true); inverseRoot = root.matrixWorld.clone().invert();
                initialPositions = Object.fromEntries(Object.entries(roots.current).map(([part, object]) => [part, object.position.clone()]));
                beginMoveEdit();
            }
            else {
                const updated = Object.fromEntries(boxes.map(box => { const local = box.position.clone().applyMatrix4(inverseRoot); return [box.userData.grip, { x: Math.round(local.x), y: Math.round(local.y), z: Math.round(local.z) }]; }));
                updateModelGrips(name, updated); endMoveEdit();
            }
        });
        const pointer = event => {
            if (dragging || tc.axis) return;
            const rect = renderer.domElement.getBoundingClientRect();
            const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
            const hit = ray.intersectObjects(boxes, false)[0];
            if (hit) { tc.attach(hit.object); highlight(hit.object); event.stopImmediatePropagation(); }
        };
        renderer.domElement.addEventListener('pointerdown', pointer, true);
        return () => {
            controls.enabled = true; renderer.domElement.removeEventListener('pointerdown', pointer, true);
            tc.detach(); tc.dispose(); scene.remove(group, helper);
            group.traverse(object => { object.geometry?.dispose(); object.material?.map?.dispose(); object.material?.dispose(); });
        };
    }, [adminMode, selectedPart, gizmoEnabled, gizmoMode, config3D, modelSettings, generation, scene, camera, renderer]);
    return null;
}
