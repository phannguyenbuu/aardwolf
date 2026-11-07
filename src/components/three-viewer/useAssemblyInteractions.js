import { useEffect } from "react";
import * as THREE from "three";
import { tubeBottomCenter, resolveGrips, defaultGrips } from "../../utils/gripPoints.js";

export default function useAssemblyInteractions({
    refs,
    partOffsets,
    basePositions,
    config3D,
    modelSettings,
    gripGeneration,
    chosenSteps,
    modelRevision,
    gizmoMode,
    gizmoSize,
    adminMode,
    gizmoEnabled,
    selectedPart,
    viewportGeneration,
    lowQuality,
    selectedElement,
    componentMaterials,
    customParams,
}) {
    const { partRootsRef, transformControlsRef, selectionBoxRef, sceneRef } = refs;
    useEffect(() => {
        Object.keys(partOffsets).forEach((key) => {
            const root = partRootsRef.current[key];
            const basePos = basePositions[key];
            const off = partOffsets[key];
            if (root && basePos && off) {
                const rotation = off.rotation || {};
                const initial = root.userData.baseRotation || (key === 'ground' ? [-90, 0, 0] : [0, 0, 0]);
                root.rotation.set(...['x', 'y', 'z'].map((axis, index) => THREE.MathUtils.degToRad(initial[index] + (rotation[axis] || 0))));
                const tx = basePos.x + off.x + (root.userData.modelOffset?.x || 0);
                const ty = basePos.y + off.y + (root.userData.modelOffset?.y || 0);
                const tz = basePos.z + off.z + (root.userData.modelOffset?.z || 0);
                if (Math.abs(root.position.x - tx) > 0.05 ||
                    Math.abs(root.position.y - ty) > 0.05 ||
                    Math.abs(root.position.z - tz) > 0.05) {
                    root.position.set(tx, ty, tz);
                }
            }
        });
    }, [partOffsets, basePositions]);

    // Join the suction assembly to the actual lower face of the handle geometry.
    useEffect(() => {
        const head = partRootsRef.current.head;
        const suction = partRootsRef.current.suction;
        if (!head || !suction) return;
        // Every tube's p2 is the bottom centre of the tube body: snap the handle's p1 onto it.
        const tubeBottom = tubeBottomCenter(partRootsRef.current.tube);
        if (tubeBottom) {
            head.updateWorldMatrix(true, true);
            const { p1 } = resolveGrips('head', config3D, modelSettings[config3D.headStack?.name]?.grips);
            const shift = tubeBottom.sub(head.localToWorld(new THREE.Vector3(p1.x, p1.y, p1.z)));
            head.position.add(shift);
            suction.position.x += shift.x;
            suction.position.z += shift.z;
            const headBase = basePositions.head || {};
            const headOffset = partOffsets.head || {};
            head.userData.modelOffset = Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, head.position[axis] - (headBase[axis] || 0) - (headOffset[axis] || 0)]));
        }
        head.updateWorldMatrix(true, true);
        suction.updateWorldMatrix(true, true);
        const headBounds = new THREE.Box3().setFromObject(head);
        const suctionBounds = new THREE.Box3().setFromObject(suction);
        if (headBounds.isEmpty() || suctionBounds.isEmpty()) return;
        suction.position.y += headBounds.min.y - suctionBounds.max.y;
        const base = basePositions.suction || { y: 0 };
        const offset = partOffsets.suction || { y: 0 };
        suction.userData.modelOffset = Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, suction.position[axis] - (base[axis] || 0) - (offset[axis] || 0)]));
        suction.updateWorldMatrix(true, true);
        const workpiece = partRootsRef.current.workpiece;
        if (workpiece) {
            const padBounds = new THREE.Box3().setFromObject(suction);
            const pieceBounds = new THREE.Box3();
            workpiece.updateWorldMatrix(true, true);
            workpiece.traverse(object => {
                if (object.isMesh) pieceBounds.expandByObject(object);
            });
            if (!padBounds.isEmpty() && !pieceBounds.isEmpty()) {
                const p2 = modelSettings[config3D.suctionPack?.name]?.grips?.p2 || defaultGrips('suction', config3D).p2;
                const anchor = suction.localToWorld(new THREE.Vector3(p2.x, p2.y, p2.z));
                const pieceCenter = pieceBounds.getCenter(new THREE.Vector3());
                workpiece.position.x += anchor.x - pieceCenter.x;
                workpiece.position.z += anchor.z - pieceCenter.z;
                workpiece.position.y += padBounds.min.y - pieceBounds.max.y;
                const pieceBase = basePositions.workpiece || { y: 0 };
                const pieceOffset = partOffsets.workpiece || { y: 0 };
                workpiece.userData.modelOffset = Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, workpiece.position[axis] - (pieceBase[axis] || 0) - (pieceOffset[axis] || 0)]));
                workpiece.updateWorldMatrix(true, true);
            }
        }
    }, [gripGeneration, partOffsets, basePositions]);

    // Parts appear only once their step has been picked; the crane and pump always show.
    useEffect(() => {
        const shown = { tube: chosenSteps.has('wll'), head: chosenSteps.has('handle'), suction: chosenSteps.has('suction'), workpiece: ['environment', 'surface', 'handle', 'suction'].every(step => chosenSteps.has(step)) };
        for (const [part, visible] of Object.entries(shown)) if (partRootsRef.current[part]) partRootsRef.current[part].visible = visible;
    }, [chosenSteps, gripGeneration, modelRevision]);

    // Attach / Detach / Configure TransformControls
    useEffect(() => {
        const tc = transformControlsRef.current;
        if (!tc) return;

        tc.setMode(gizmoMode || 'translate');
        tc.setRotationSnap(Math.PI / 2);
        tc.size = gizmoSize || 0.85;

        if (adminMode && gizmoEnabled && !(gizmoMode !== 'rotate' && ['crane', 'pump', 'tube', 'head', 'suction'].includes(selectedPart)) && selectedPart && partRootsRef.current[selectedPart]) {
            tc.attach(partRootsRef.current[selectedPart]);
        } else {
            tc.detach();
        }
    }, [selectedPart, gizmoEnabled, gizmoMode, gizmoSize, adminMode, viewportGeneration, modelRevision, lowQuality]);

    // Sync Selection Box3Helper
    useEffect(() => {
        if (!selectionBoxRef.current || !sceneRef.current) return;
        const helper = selectionBoxRef.current;
        const box3 = helper.box;

        if (!adminMode || !selectedPart || !partRootsRef.current[selectedPart]) {
            helper.visible = false;
            return;
        }

        let selection = partRootsRef.current[selectedPart];
        if (selectedElement) selection.traverse(object => { if (object.userData.elementKey === selectedElement) selection = object; });
        box3.setFromObject(selection);
        helper.visible = !box3.isEmpty();
    }, [adminMode, selectedPart, selectedElement, partOffsets, config3D, componentMaterials, customParams, viewportGeneration, modelRevision, lowQuality]);
}
