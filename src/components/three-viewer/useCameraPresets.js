import { useEffect } from "react";
import { extractPoint3 } from "../../utils/configuratorHelpers.js";
import * as THREE from "three";

export default function useCameraPresets({ refs, cameraPresetTrigger, setIsTurntableActive, setCameraPresetTrigger, config3D, savedViews }) {
    const { cameraRef, controlsRef, cameraUserControlledRef, hasFramedCameraRef, currentCenterRef, currentSizeRef, cameraAnimRef } = refs;
    useEffect(() => {
        if (!cameraPresetTrigger || !cameraRef.current || !controlsRef.current) return;
        cameraUserControlledRef.current = true;
        hasFramedCameraRef.current = true;

        if (cameraPresetTrigger === '360') {
            controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
            setIsTurntableActive(controlsRef.current.autoRotate);
            setCameraPresetTrigger(null);
            return;
        }

        const center = currentCenterRef.current;
        const size = currentSizeRef.current;
        const span = Math.max(size.x, size.y, 3000);

        const p2Match = config3D?.crane?.name ? extractPoint3(config3D.crane.name)[1] : null;
        const padX = p2Match ? p2Match.x : center.x;

        const presets = {
            'cornell-reference': {
                pos: new THREE.Vector3(center.x, 3200, 9600),
                target: new THREE.Vector3(center.x, 3200, 0),
                fov: 45
            },
            'front-view': { pos: new THREE.Vector3(center.x, center.y, Math.max(6400, span * 1.75)), target: center, fov: 34 },
            'left-view': { pos: new THREE.Vector3(center.x + Math.max(6400, span * 1.75), center.y, 0), target: center, fov: 34 },
            'right-view': { pos: new THREE.Vector3(center.x - Math.max(6400, span * 1.75), center.y, 0), target: center, fov: 34 },
            'top-view': { pos: new THREE.Vector3(center.x, Math.max(7200, span * 1.95), 0), target: center, fov: 34 },
            'bottom-view': { pos: new THREE.Vector3(center.x, center.y - Math.max(7200, span * 1.95), center.z + 1), target: center, fov: 34 },
            'ortho-view': { pos: new THREE.Vector3(center.x + (span * 0.45), center.y + (span * 0.38), Math.max(6000, span * 1.65)), target: center, fov: 34 },
            'focus-suction': { pos: new THREE.Vector3(padX + 900, 750, 1600), target: new THREE.Vector3(padX, 350, 0), fov: 32 }
        };

        const savedView = savedViews[cameraPresetTrigger];
        const targetConfig = savedView ? { pos: new THREE.Vector3().fromArray(savedView.position), target: new THREE.Vector3().fromArray(savedView.target), fov: savedView.fov } : presets[cameraPresetTrigger];
        if (targetConfig) {
            if (targetConfig.fov) {
                cameraRef.current.fov = targetConfig.fov;
                cameraRef.current.updateProjectionMatrix();
            }
            cameraAnimRef.current = {
                active: true,
                startPos: cameraRef.current.position.clone(),
                endPos: targetConfig.pos,
                startTarget: controlsRef.current.target.clone(),
                endTarget: targetConfig.target,
                startTime: null,
                duration: 0.8
            };
        }

        setCameraPresetTrigger(null);
    }, [cameraPresetTrigger, setCameraPresetTrigger, config3D, setIsTurntableActive, savedViews]);
}
