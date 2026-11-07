import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { DEFAULT_CENTER } from './constants.js';

export default function useViewportRefs({ basePositions, selectedPart }) {
    const containerRef = useRef(null);
    const studioRendererRef = useRef(null);
    const hdrSSRRef = useRef(null);
    const renderModeRef = useRef('studio-render');
    const qualityRef = useRef({});
    const statusTimeRef = useRef(0);
    const exportAbortRef = useRef(null);
    const sceneFileRevisionRef = useRef(0);
    const reloadTargetRef = useRef(null);
    const lowQualityRef = useRef(true);
    const legacyPreviewRef = useRef(null);
    const pathTraceOpenRef = useRef(false);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const composerRef = useRef(null);
    const antiAliasingPassRef = useRef(null);
    const controlsRef = useRef(null);
    const transformControlsRef = useRef(null);
    const partRootsRef = useRef({});
    const basePositionsRef = useRef(basePositions);
    const isDraggingGizmoRef = useRef(false);
    const selectedPartRef = useRef(selectedPart);
    const loadedObjectsMapRef = useRef(new Map());
    const modelRequestsRef = useRef(new Map());
    const prefetchedFilesRef = useRef(new Map());
    const modelLoadingRef = useRef(true);
    const isReadyRef = useRef(false);
    const hasFramedCameraRef = useRef(false);
    const cameraUserControlledRef = useRef(false);
    const workpieceGroupRef = useRef(null);
    const texturesRef = useRef({});
    const currentCenterRef = useRef(DEFAULT_CENTER.clone());
    const currentSizeRef = useRef(new THREE.Vector3(3300, 2600, 1000));
    const lightTargetRef = useRef(null);
    const edgeLineMatRef = useRef(null);
    const keyLightRef = useRef(null);
    const ambientLightRef = useRef(null);
    const fillLightRef = useRef(null);
    const rimLightRef = useRef(null);
    const shadowFloorRef = useRef(null);
    const blueprintGridRef = useRef(null);
    const cornellGroupRef = useRef(null);
    const cornellCeilingLightRef = useRef(null);
    const cornellRedBounceRef = useRef(null);
    const cornellGreenBounceRef = useRef(null);
    const cornellLeftWallMatRef = useRef(null);
    const cornellRightWallMatRef = useRef(null);
    const cornellBackWallMatRef = useRef(null);
    const cornellFloorMatRef = useRef(null);
    const cornellCeilingMatRef = useRef(null);
    const cornellEmitterMatRef = useRef(null);
    const selectionBoxRef = useRef(null);
    const pointerStartRef = useRef({ x: 0, y: 0 });
    const cameraAnimRef = useRef({
        active: false,
        startPos: new THREE.Vector3(),
        endPos: new THREE.Vector3(),
        startTarget: new THREE.Vector3(),
        endTarget: new THREE.Vector3(),
        startTime: null,
        duration: 0.8
    });
    const sceneEditRef = useRef(null);
    return useMemo(() => ({
        containerRef,
        studioRendererRef,
        hdrSSRRef,
        renderModeRef,
        qualityRef,
        statusTimeRef,
        exportAbortRef,
        sceneFileRevisionRef,
        reloadTargetRef,
        lowQualityRef,
        legacyPreviewRef,
        pathTraceOpenRef,
        sceneRef,
        cameraRef,
        rendererRef,
        composerRef,
        antiAliasingPassRef,
        controlsRef,
        transformControlsRef,
        partRootsRef,
        basePositionsRef,
        isDraggingGizmoRef,
        selectedPartRef,
        loadedObjectsMapRef,
        modelRequestsRef,
        prefetchedFilesRef,
        modelLoadingRef,
        isReadyRef,
        hasFramedCameraRef,
        cameraUserControlledRef,
        workpieceGroupRef,
        texturesRef,
        currentCenterRef,
        currentSizeRef,
        lightTargetRef,
        edgeLineMatRef,
        keyLightRef,
        ambientLightRef,
        fillLightRef,
        rimLightRef,
        shadowFloorRef,
        blueprintGridRef,
        cornellGroupRef,
        cornellCeilingLightRef,
        cornellRedBounceRef,
        cornellGreenBounceRef,
        cornellLeftWallMatRef,
        cornellRightWallMatRef,
        cornellBackWallMatRef,
        cornellFloorMatRef,
        cornellCeilingMatRef,
        cornellEmitterMatRef,
        selectionBoxRef,
        pointerStartRef,
        cameraAnimRef,
        sceneEditRef,
    }), []);
}
