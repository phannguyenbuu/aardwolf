import { useConfigurator } from "../../context/ConfiguratorContext.jsx";
import { useState, useEffect } from "react";
import { LegacyPreview } from "../../rendering/LegacyPreview.js";
import * as THREE from "three";
import useViewportRefs from './useViewportRefs.js';
import useViewportCapture from './useViewportCapture.js';
import useCameraRestore from './useCameraRestore.js';
import useViewportScene from './useViewportScene.js';
import useViewportMaterials from './useViewportMaterials.js';
import useAssembly from './useAssembly.js';
import useModelLoading from './useModelLoading.js';
import useAssemblyInteractions from './useAssemblyInteractions.js';
import useCameraPresets from './useCameraPresets.js';
import useViewportLighting from './useViewportLighting.js';
import useViewportExport from './useViewportExport.js';

export default function useThreeViewport() {
    const {
        captureCameraRef,
        cameraRestore,
        setCameraRestore,
        modelSettings,
        saveAllSettings,
        settingsStatus,
        savedViews,
        settingsDirty,
        settingsSaving,
        settingsSaved,
        trackCamera,
        undoEdit,
        redoEdit,
        canUndo,
        canRedo,
        beginMoveEdit,
        endMoveEdit,
        config3D,
        chosenSteps,
        actualLoad,
        unit,
        setIs3DLoading,
        is3DLoading,
        setLoadingProgress,
        loadingProgress,
        cameraPresetTrigger,
        setCameraPresetTrigger,
        takeSnapshotRef,
        setShow3DModal,
        viewportMode,
        studioTheme,
        workLoadLimit,
        craneType,
        jibLength,
        environment,
        surfaceType: userSurfaceType,
        suctionHeadId,
        handleId,
        suctionModelVariant,
        customNotes,
        selectedPart,
        setSelectedPart,
        cameraTelemetry,
        selectedElement,
        setSelectedElement,
        setMaterialElements,
        setActiveLeftTab,
        adminMode,
        componentMaterials,
        objectMaterialMapping,
        customParams,
        cornellLeftColor,
        cornellRightColor,
        cornellBleedIntensity,
        sceneLights,
        waveletParams,
        isTurntableActive,
        setIsTurntableActive,
        setIsExporting,
        exportRenderTrigger,
        setCameraTelemetry,
        basePositions,
        partOffsets,
        setPartOffsetFull,
        updatePartRotation,
        gizmoEnabled,
        gizmoMode,
        gizmoSize,
    } = useConfigurator();
    const refs = useViewportRefs({ basePositions, selectedPart });
    const {
        containerRef,
        studioRendererRef,
        hdrSSRRef,
        renderModeRef,
        qualityRef,
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
        partRootsRef,
        basePositionsRef,
        selectedPartRef,
        loadedObjectsMapRef,
        modelRequestsRef,
        prefetchedFilesRef,
        isReadyRef,
        shadowFloorRef,
        sceneEditRef,
    } = refs;
    const [, setRenderStatus] = useState('');
    const [exportProgress, setExportProgress] = useState(null);
    const [renderDialog, setRenderDialog] = useState(null);
    const [cameraInfoOpen, setCameraInfoOpen] = useState(false);
    const [lowQuality, setLowQuality] = useState(true);
    const [lightingReady, setLightingReady] = useState(false);
    const [frameReady, setFrameReady] = useState(false);
    const [settingsCopied, setSettingsCopied] = useState(false);
    const [materialRefresh, setMaterialRefresh] = useState(0);
    const [gripGeneration, setGripGeneration] = useState(0);
    const [clickedPin, setClickedPin] = useState(null);
    const [viewportGeneration, setViewportGeneration] = useState(0);
    const [modelRevision, setModelRevision] = useState(0);
    const [modelRetry, setModelRetry] = useState(0);
    const [modelLoadError, setModelLoadError] = useState('');
    const [backgroundModelProgress, setBackgroundModelProgress] = useState(null);

    useEffect(() => {
        if (lightingReady && modelRevision && !is3DLoading) setLowQuality(false);
    }, [lightingReady, modelRevision, is3DLoading]);

    useEffect(() => {
        const refresh = () => {
            sceneRef.current?.traverse(child => { if (child.isMesh) delete child.userData.materialSignature; });
            setMaterialRefresh(value => value + 1);
        };
        window.addEventListener('aardwolf-reapply-materials', refresh);
        return () => window.removeEventListener('aardwolf-reapply-materials', refresh);
    }, []);

    if (!legacyPreviewRef.current || legacyPreviewRef.current.constructor !== LegacyPreview) {
        legacyPreviewRef.current?.dispose();
        legacyPreviewRef.current = new LegacyPreview();
    }
    useEffect(() => {
        lowQualityRef.current = lowQuality;
    }, [lowQuality]);
    useEffect(() => () => legacyPreviewRef.current?.dispose(), []);

    useEffect(() => { pathTraceOpenRef.current = renderDialog === 'pathtrace'; }, [renderDialog]);
    const { captureForDialog, renderForDialog } = useViewportCapture({ refs, setRenderDialog });

    useEffect(() => {
        renderModeRef.current = viewportMode;
        qualityRef.current = { ...waveletParams, theme: studioTheme };
        const environmentIntensity = sceneLights.environment?.intensity ?? 1;
        legacyPreviewRef.current.intensity = environmentIntensity;
        if (sceneRef.current) {
            sceneRef.current.environmentIntensity = environmentIntensity;
            sceneRef.current.environmentRotation.y = THREE.MathUtils.degToRad(sceneLights.environment?.rotation ?? 0);
        }
        sceneRef.current?.traverse(light => {
            if (!light.isLight || !light.shadow) return;
            light.shadow.intensity = Math.min(1, sceneLights.shadow?.darkness ?? 1);
            light.shadow.radius = sceneLights.shadow?.blur ?? 12;
            light.shadow.needsUpdate = true;
        });
        const shadowReceiver = sceneRef.current?.getObjectByName('ground_shadow_overlay');
        if (shadowReceiver) shadowReceiver.material.opacity = shadowReceiver.parent.material.userData.shadowDarknessUniform ? 0 : Math.min(1, .8 * (sceneLights.shadow?.darkness ?? 1));
        const floorMaterial = shadowFloorRef.current?.material;
        if (floorMaterial?.userData.shadowDarknessUniform) floorMaterial.userData.shadowDarknessUniform.value = sceneLights.shadow?.darkness ?? 1;
        studioRendererRef.current?.invalidate();
        hdrSSRRef.current?.invalidate();
    }, [viewportMode, config3D, actualLoad, unit, componentMaterials, customParams, partOffsets, modelSettings, studioTheme, sceneLights, waveletParams]);

    useEffect(() => {
        if (!adminMode) {
            setSelectedPart('');
            setSelectedElement('');
            setClickedPin(null);
        }
    }, [adminMode, setSelectedPart, setSelectedElement]);

    const antiAliasingStrength = Math.max(0, Math.min(1000, sceneLights.rendering?.antiAliasingStrength ?? (sceneLights.rendering?.antiAliasing === 'off' ? 0 : 100)));
    useEffect(() => {
        const pass = antiAliasingPassRef.current;
        if (pass) {
            pass.enabled = antiAliasingStrength > 0;
            pass.uniformsBlend.strength.value = antiAliasingStrength / 100;
        }
    }, [antiAliasingStrength]);

    useEffect(() => {
        selectedPartRef.current = selectedPart;
    }, [selectedPart]);

    useEffect(() => {
        basePositionsRef.current = basePositions;
    }, [basePositions]);

    useEffect(() => {
        const renderer = rendererRef.current;
        if (!renderer) return;
        renderer.setPixelRatio(lowQualityRef.current ? Math.min(window.devicePixelRatio, 1) : Math.min(Math.max(window.devicePixelRatio, 1.5), 2));
        const host = containerRef.current;
        if (host) { renderer.setSize(host.clientWidth, host.clientHeight, false); composerRef.current?.setPixelRatio(renderer.getPixelRatio()); composerRef.current?.setSize(host.clientWidth, host.clientHeight); }
        renderer.shadowMap.needsUpdate = true;
    }, [lowQuality, viewportGeneration]);

    useCameraRestore({ refs, captureCameraRef, cameraRestore, is3DLoading, setCameraRestore, viewportGeneration });

    // Auto-hide 3D click pin
    useEffect(() => {
        if (!clickedPin) return;
        const timer = setTimeout(() => {
            setClickedPin(null);
        }, 3000);
        return () => clearTimeout(timer);
    }, [clickedPin]);

    // Hook snapshot method for PDF generation
    useEffect(() => {
        takeSnapshotRef.current = () => {
            return new Promise((resolve) => {
                if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
                    resolve('/assets/images/image-1.png');
                    return;
                }
                if (!studioRendererRef.current || studioRendererRef.current.tracer.samples < 1) rendererRef.current.render(sceneRef.current, cameraRef.current);
                const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
                resolve(dataUrl);
            });
        };
    }, [takeSnapshotRef]);

    // Initialize Three.js scene
    useViewportScene({
        refs,
        lowQuality,
        setLightingReady,
        setFrameReady,
        setRenderStatus,
        antiAliasingStrength,
        studioTheme,
        gizmoMode,
        gizmoSize,
        beginMoveEdit,
        endMoveEdit,
        updatePartRotation,
        setPartOffsetFull,
        setSelectedPart,
        setSelectedElement,
        setActiveLeftTab,
        setClickedPin,
        trackCamera,
        setCameraTelemetry,
        setViewportGeneration,
    });

    sceneEditRef.current = { componentMaterials, customParams, objectMaterialMapping, partOffsets, gizmoEnabled, adminMode };
    // Apply PBR Materials to components
    useViewportMaterials({ refs, modelSettings, objectMaterialMapping, componentMaterials, customParams, setMaterialElements, materialRefresh });

    // Update 3D Scene models
    const { update3DScene } = useAssembly({ refs, config3D, modelSettings, actualLoad, unit, basePositions, setMaterialElements, studioTheme, setGripGeneration });

    useModelLoading({
        refs,
        setFrameReady,
        config3D,
        viewportGeneration,
        setModelLoadError,
        setBackgroundModelProgress,
        setIs3DLoading,
        setLoadingProgress,
        setModelRevision,
        modelRetry,
    });

    useEffect(() => {
        if (isReadyRef.current && config3D.data3D.filter(Boolean).every(item => loadedObjectsMapRef.current.has(item.name))) {
            update3DScene();
            sceneRef.current.userData.assemblyReady = true;
        }
    }, [config3D, actualLoad, unit, update3DScene, modelRevision]);

    // Sync object positions when partOffsets changes in React state (smooth, without full scene rebuild)
    useAssemblyInteractions({
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
    });

    useEffect(() => {
        if (controlsRef.current) controlsRef.current.autoRotate = isTurntableActive;
    }, [isTurntableActive, viewportGeneration]);

    // Handle Camera Presets trigger
    useCameraPresets({ refs, cameraPresetTrigger, setIsTurntableActive, setCameraPresetTrigger, config3D, savedViews });

    // Theme & Lighting updates
    useViewportLighting({ refs, studioTheme, sceneLights, cornellLeftColor, cornellRightColor, cornellBleedIntensity, adminMode });

    // Handle high-resolution 4K Studio Render export
    useViewportExport({ refs, setIsExporting, setExportProgress, setRenderStatus, exportRenderTrigger });

    const reloadScene = () => {
        sceneFileRevisionRef.current = Date.now();
        THREE.Cache.clear();
        const names = { crane: config3D.crane?.name, pump: config3D.pumpGroup?.name, tube: config3D.tube?.name, head: config3D.headStack?.name, suction: config3D.suctionPack?.name };
        const target = names[selectedPart];
        reloadTargetRef.current = target || null;
        if (target) { loadedObjectsMapRef.current.delete(target); prefetchedFilesRef.current.delete(target); }
        else { loadedObjectsMapRef.current.clear(); prefetchedFilesRef.current.clear(); }
        modelRequestsRef.current.clear();
        for (const [part, root] of Object.entries(partRootsRef.current)) {
            if (!target || part === selectedPart) root.userData.assemblySignature = null;
        }
        setClickedPin(null);
        setModelRetry(value => value + 1);
    };
    return {
        studioTheme,
        viewportMode,
        adminMode,
        sceneRef,
        cameraRef,
        rendererRef,
        partRootsRef,
        controlsRef,
        gripGeneration,
        lowQuality,
        setLowQuality,
        is3DLoading: is3DLoading || !lightingReady || !frameReady,
        lightingReady,
        backgroundModelProgress,
        loadingProgress,
        modelLoadError,
        setModelRetry,
        renderDialog,
        qualityRef,
        setRenderDialog,
        captureForDialog,
        renderForDialog,
        containerRef,
        setShow3DModal,
        reloadScene,
        takeSnapshotRef,
        setCameraInfoOpen,
        cameraInfoOpen,
        cameraTelemetry,
        unit,
        craneType,
        jibLength,
        workLoadLimit,
        environment,
        userSurfaceType,
        actualLoad,
        suctionHeadId,
        handleId,
        suctionModelVariant,
        customNotes,
        setSettingsCopied,
        settingsCopied,
        clickedPin,
        exportProgress,
        exportAbortRef,
        settingsSaving,
        settingsDirty,
        settingsSaved,
        saveAllSettings,
        settingsStatus,
        undoEdit,
        canUndo,
        redoEdit,
        canRedo,
    };
}
