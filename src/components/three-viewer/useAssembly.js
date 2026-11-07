import { useCallback } from "react";
import * as THREE from "three";
import { resolveMaterial } from "../../utils/sceneSettings.js";
import { createPBRMaterial, applyWorldTextureSize } from "../../constants/pbrMaterials.js";
import { ALL_PRELOAD_ITEMS } from "../../constants/data.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { applyMaterialEdgeBevel } from "../../rendering/materialEdgeBevel.js";
import { DEFAULT_CAMERA } from "../../utils/cameraViews.js";
import { smoothRubberHose } from '../../rendering/smoothRubberHose.js';

export default function useAssembly({ refs, config3D, modelSettings, actualLoad, unit, basePositions, setMaterialElements, studioTheme, setGripGeneration }) {
    const {
        sceneEditRef,
        sceneRef,
        isReadyRef,
        partRootsRef,
        workpieceGroupRef,
        loadedObjectsMapRef,
        legacyPreviewRef,
        texturesRef,
        shadowFloorRef,
        currentCenterRef,
        currentSizeRef,
        lightTargetRef,
        hasFramedCameraRef,
        controlsRef,
        cameraRef,
        transformControlsRef,
        selectedPartRef,
    } = refs;
    const update3DScene = useCallback(() => {
        const {
  customParams,
  objectMaterialMapping,
  partOffsets,
  gizmoEnabled,
  adminMode
} = sceneEditRef.current;
        const scene = sceneRef.current;
        if (!scene || !isReadyRef.current) return;

        const { crane, pumpGroup, tube, headStack, suctionPack } = config3D;
        const desired = { crane: crane?.name, pump: pumpGroup?.name, tube: tube?.name, head: headStack?.name, suction: suctionPack?.name, workpiece: '@generated' };
        const signature = key => JSON.stringify([desired[key], modelSettings[desired[key]], key === 'workpiece' ? [actualLoad.length, actualLoad.width, actualLoad.height, unit] : null]);
        // Retain unchanged modules, including their GPU buffers and element selections.
        for (let i = scene.children.length - 1; i >= 0; i--) {
            const child = scene.children[i];
            if (!child.isLight && !child.isAxesHelper && !child.isStageElement) {
                const key = child.userData.partKey;
                if (key && desired[key] && child.userData.assemblySignature === signature(key)) continue;
                if (child.userData.partKey) child.traverse(object => {
                    if (object.isMesh) {
                        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material?.dispose());
                        if (child.userData.partKey === 'workpiece') object.geometry.dispose();
                    }
                });
                scene.remove(child);
            }
        }
        partRootsRef.current = Object.fromEntries(scene.children.filter(child => child.userData.partKey && !child.isStageElement).map(child => [child.userData.partKey, child]));
        const elements = [];

        const base = basePositions;
        const offsets = partOffsets;

        const createPartGroup = (partKey, objectName, isWorkpiece = false) => {
            const basePos = base[partKey] || { x: 0, y: 0, z: 0 };
            const off = offsets[partKey] || { x: 0, y: 0, z: 0 };
            const retained = partRootsRef.current[partKey];
            if (retained) {
                retained.position.set(basePos.x + (off.x || 0), basePos.y + (off.y || 0), basePos.z + (off.z || 0));
                retained.rotation.set(...['x', 'y', 'z'].map((axis, index) => THREE.MathUtils.degToRad((retained.userData.baseRotation?.[index] || 0) + (off.rotation?.[axis] || 0))));
                elements.push(...(retained.userData.materialElements || []).map(element => {
                    const index = element.key.split('::').slice(2).join('::');
                    const material = resolveMaterial(objectMaterialMapping, partKey, objectName, index || undefined);
                    return { ...element, material, params: customParams[material] };
                }));
                return retained;
            }
            const elementStart = elements.length;

            const group = new THREE.Group();
            const model = modelSettings[objectName] || {};
            group.name = `root_${partKey}`;
            group.userData.partKey = partKey;
            group.userData.assemblySignature = signature(partKey);
            group.position.set(basePos.x + off.x, basePos.y + off.y, basePos.z + off.z);
            group.rotation.set(...['x', 'y', 'z'].map((axis, index) => THREE.MathUtils.degToRad((model.rotation?.[index] || 0) + (off.rotation?.[axis] || 0))));
            group.userData.baseRotation = model.rotation || [0, 0, 0];
            group.scale.setScalar(model.scale || 1);

            if (isWorkpiece) {
                const l = Math.max(50, actualLoad.length);
                const w = Math.max(50, actualLoad.width);
                const h = Math.max(20, actualLoad.height);

                const boxGeo = new THREE.BoxGeometry(l, h, w);
                const wpMatId = resolveMaterial(objectMaterialMapping, 'workpiece');
                const wpMat = createPBRMaterial(wpMatId, customParams[wpMatId]);
                const workpieceMesh = new THREE.Mesh(boxGeo, wpMat);
                workpieceMesh.userData.partKey = 'workpiece';
                workpieceMesh.userData.elementKey = 'workpiece::box';
                elements.push({ key: 'workpiece::box', partKey, label: 'Box', material: wpMatId, params: customParams[wpMatId] });
                workpieceMesh.castShadow = true;
                workpieceMesh.receiveShadow = true;
                group.add(workpieceMesh);

                const edgesGeo = new THREE.EdgesGeometry(boxGeo);
                const edgesMat = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 });
                const wireframe = new THREE.LineSegments(edgesGeo, edgesMat);
                group.add(wireframe);

                workpieceGroupRef.current = group;
            } else if (objectName) {
                const proto = loadedObjectsMapRef.current.get(objectName);
                if (proto) {
                    const clone = proto.clone(true);
                    const importedAsset = ALL_PRELOAD_ITEMS.find(item => item.name === objectName && item.importedOpt);
                    if (importedAsset) {
                        if (partKey === 'suction') clone.rotation.x += /rectangular_pads/i.test(objectName) ? -Math.PI / 2 : Math.PI / 2;
                        if (partKey === 'head') clone.rotation.x -= Math.PI / 2;
                        // OBJ exports use Y-up in FBX. Keep scale; position the upper connection at the part anchor.
                        // Handles are not symmetric, so they keep the file's own base point as the anchor.
                        if (partKey !== 'head') {
                            clone.updateMatrixWorld(true);
                            const bounds = new THREE.Box3().setFromObject(clone);
                            const center = bounds.getCenter(new THREE.Vector3());
                            clone.position.sub(new THREE.Vector3(center.x, bounds.max.y, center.z));
                        }
                    }
                    let meshIndex = 0;
                    clone.traverse((child) => {
                        if (child.isMesh) {
                            // FBX hose meshes have coarse silhouettes. Cache subdivision on
                            // the shared source geometry so changing WLL never repeats it.
                            const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
                            if (partKey === 'crane' && sourceMaterials.some(material => /black rubber/i.test(material.name))) {
                                const geometry = child.geometry;
                                geometry.userData.smoothHose ??= smoothRubberHose(geometry, 2);
                                child.geometry = geometry.userData.smoothHose;
                            }
                            if (partKey === 'crane' && /WALL BRACED/i.test(objectName) && /^bounding/i.test(child.name)) {
                                const sourceGeometry = child.geometry;
                                if (!sourceGeometry.userData.roundedWallGeometry) {
                                    sourceGeometry.computeBoundingBox();
                                    const bounds = sourceGeometry.boundingBox;
                                    const size = bounds.getSize(new THREE.Vector3());
                                    const center = bounds.getCenter(new THREE.Vector3());
                                    const radius = Math.min(size.x, size.y, size.z) * .025;
                                    const rounded = new RoundedBoxGeometry(size.x, size.y, size.z, 5, radius);
                                    rounded.translate(center.x, center.y, center.z);
                                    // The wall uses one surface across all six faces.
                                    rounded.groups.forEach(group => { group.materialIndex = 0; });
                                    sourceGeometry.userData.roundedWallGeometry = rounded;
                                }
                                child.geometry = sourceGeometry.userData.roundedWallGeometry;
                            }
                            const elementKey = `${partKey}::${objectName}::${meshIndex++}`;
                            child.userData.elementKey = elementKey;
                            child.userData.partKey = partKey;
                            child.userData.modelName = objectName;
                            if (partKey === 'tube' && !child.geometry.attributes.uv) {
                                child.geometry.computeBoundingBox();
                                const bounds = child.geometry.boundingBox;
                                const size = bounds.getSize(new THREE.Vector3());
                                const axes = ['x', 'y', 'z'].sort((a, b) => size[b] - size[a]);
                                if (size[axes[0]] > size[axes[1]] * 4) {
                                    child.geometry = child.geometry.clone();
                                    const center = bounds.getCenter(new THREE.Vector3());
                                    const positions = child.geometry.attributes.position;
                                    const uv = new Float32Array(positions.count * 2);
                                    const point = new THREE.Vector3();
                                    for (let i = 0; i < positions.count; i++) {
                                        point.fromBufferAttribute(positions, i);
                                        uv[i * 2] = Math.atan2(point[axes[2]] - center[axes[2]], point[axes[1]] - center[axes[1]]) / (2 * Math.PI) + .5;
                                        uv[i * 2 + 1] = (point[axes[0]] - bounds.min[axes[0]]) / size[axes[0]];
                                    }
                                    child.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
                                }
                            }
                            const matId = resolveMaterial(objectMaterialMapping, partKey, objectName, meshIndex - 1);
                            const customOverride = { ...customParams[matId] };
                            elements.push({ key: elementKey, partKey, label: `${meshIndex}. ${child.name || 'Mesh'}`, sourcePath: importedAsset?.file || `/models/aardwolf_all_part_${objectName}.fbx`, material: matId, params: customOverride, surfaceGroups: child.geometry.groups.map(g => ({ slot: g.materialIndex, count: g.count })) });
                            legacyPreviewRef.current.originalMaterials.set(child, child.material);
                            child.material = createPBRMaterial(matId, customOverride, customParams);
                            applyMaterialEdgeBevel(child, child.material);
                            applyWorldTextureSize(child, child.material);
                            child.castShadow = true;
                            child.receiveShadow = true;

                            if (partKey === 'tube' && texturesRef.current.tubeTex && !customOverride.diffuseImage && !customOverride.originalSurfaces && matId === 'yellow_tube_logo') {
                                child.material.map = texturesRef.current.tubeTex;
                                child.material.needsUpdate = true;
                            }
                        }
                    });
                    group.add(clone);
                }
            }

            group.userData.materialElements = elements.slice(elementStart);
            scene.add(group);
            partRootsRef.current[partKey] = group;
            return group;
        };

        if (crane) createPartGroup('crane', crane.name);
        if (pumpGroup) createPartGroup('pump', pumpGroup.name);
        if (tube) createPartGroup('tube', tube.name);
        if (headStack) createPartGroup('head', headStack.name);
        if (suctionPack) createPartGroup('suction', suctionPack.name);
        createPartGroup('workpiece', null, true);
        const ground = shadowFloorRef.current;
        if (ground) {
            const offset = offsets.ground || { x: 0, y: 0, z: 0 };
            ground.position.set(offset.x ?? 0, offset.y ?? 0, offset.z ?? 0);
            ground.userData.baseRotation = [-90, 0, 0];
            ground.rotation.set(...['x', 'y', 'z'].map((axis, index) => THREE.MathUtils.degToRad(ground.userData.baseRotation[index] + (offset.rotation?.[axis] || 0))));
            const material = resolveMaterial(objectMaterialMapping, 'ground');
            const params = customParams[material];
            ground.material.dispose();
            ground.material = createPBRMaterial(material, params, customParams);
            partRootsRef.current.ground = ground;
            elements.push({ key: 'ground::plane', partKey: 'ground', label: 'Ground Plane', material, params });
        }
        setMaterialElements(elements);

        // Auto bounding box
        const bbox = new THREE.Box3();
        scene.traverse((child) => {
            if (child.isMesh && child.userData?.partKey && !child.isStageElement && !child.isSprite && !child.isLineSegments) {
                bbox.expandByObject(child);
            }
        });

        if (!bbox.isEmpty()) {
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            bbox.getCenter(center);
            bbox.getSize(size);
            currentCenterRef.current.copy(center);
            currentSizeRef.current.copy(size);

            if (lightTargetRef.current) {
                lightTargetRef.current.position.set(center.x, 0, 0);
            }

            // Frame once on initial load; edits preserve the user's camera and orbit target.
            if (!hasFramedCameraRef.current && controlsRef.current && cameraRef.current) {
                if (studioTheme === 'cornell') {
                    // Lock into Cornell Box reference perspective
                    cameraRef.current.fov = 45;
                    cameraRef.current.position.set(center.x, 3200, 9600);
                    controlsRef.current.target.set(center.x, 3200, 0);
                } else {
                    cameraRef.current.fov = DEFAULT_CAMERA.fov;
                    cameraRef.current.position.fromArray(DEFAULT_CAMERA.position);
                    controlsRef.current.target.fromArray(DEFAULT_CAMERA.target);
                }
                cameraRef.current.updateProjectionMatrix();
                controlsRef.current.update();
                hasFramedCameraRef.current = true;
            }
        }

        // Attach transform controls to active selectedPart
        const tc = transformControlsRef.current;
        const activePart = selectedPartRef.current;
        if (tc) {
            if (adminMode && gizmoEnabled && !(transformControlsRef.current.mode !== 'rotate' && ['crane', 'pump', 'tube', 'head', 'suction'].includes(activePart)) && activePart && partRootsRef.current[activePart]) {
                tc.attach(partRootsRef.current[activePart]);
            } else {
                tc.detach();
            }
        }
        setGripGeneration(value => value + 1);
    }, [config3D, actualLoad, unit, studioTheme, basePositions, modelSettings]);
    return { update3DScene };
}
