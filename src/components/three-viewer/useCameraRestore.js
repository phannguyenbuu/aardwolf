import { useEffect } from "react";
import { defaultCameraViews } from "../../utils/cameraViews.js";

export default function useCameraRestore({ refs, captureCameraRef, cameraRestore, is3DLoading, setCameraRestore, viewportGeneration }) {
    const {
        cameraRef,
        controlsRef,
        basePositionsRef,
        currentCenterRef,
        currentSizeRef,
        isReadyRef,
        cameraUserControlledRef,
        cameraAnimRef,
        hasFramedCameraRef,
    } = refs;
    useEffect(() => {
        captureCameraRef.current = () => {
            const camera = cameraRef.current, controls = controlsRef.current;
            const padX = basePositionsRef.current.suction?.x;
            return camera && controls ? { position: camera.position.toArray(), target: controls.target.toArray(), fov: camera.fov,
                views: defaultCameraViews(currentCenterRef.current, currentSizeRef.current, padX) } : null;
        };
        return () => { captureCameraRef.current = null; };
    }, [captureCameraRef]);

    useEffect(() => {
        if (!cameraRestore || is3DLoading || !isReadyRef.current || !cameraRef.current || !controlsRef.current) return;
        // A delayed settings response must never overwrite a view already adjusted by the user.
        if (cameraUserControlledRef.current) { setCameraRestore(null); return; }
        cameraAnimRef.current.active = false;
        cameraRef.current.position.fromArray(cameraRestore.position);
        cameraRef.current.fov = cameraRestore.fov;
        cameraRef.current.updateProjectionMatrix();
        controlsRef.current.target.fromArray(cameraRestore.target);
        controlsRef.current.update();
        hasFramedCameraRef.current = true;
        setCameraRestore(null);
    }, [cameraRestore, is3DLoading, viewportGeneration, setCameraRestore]);
}
