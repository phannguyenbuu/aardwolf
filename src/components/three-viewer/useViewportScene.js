import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createViewportShadowLight } from "../../rendering/viewportShadows.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createPBRMaterial } from "../../constants/pbrMaterials.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { DEFAULT_CENTER } from './constants.js';
import createCornellEnvironment from './createCornellEnvironment.js';
import startViewportLoop from './startViewportLoop.js';

export default function useViewportScene({
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
}) {
    const highQualitySetupRef = useRef(null);
    const {
        containerRef,
        hasFramedCameraRef,
        sceneRef,
        lowQualityRef,
        rendererRef,
        legacyPreviewRef,
        ambientLightRef,
        lightTargetRef,
        keyLightRef,
        fillLightRef,
        rimLightRef,
        cameraRef,
        antiAliasingPassRef,
        composerRef,
        cameraUserControlledRef,
        cameraAnimRef,
        controlsRef,
        shadowFloorRef,
        blueprintGridRef,
        selectionBoxRef,
        transformControlsRef,
        isDraggingGizmoRef,
        basePositionsRef,
        texturesRef,
        pointerStartRef,
        sceneEditRef,
        isReadyRef,
        modelRequestsRef,
        studioRendererRef,
        hdrSSRRef,
        exportAbortRef,
    } = refs;
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        hasFramedCameraRef.current = false;

        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);
        sceneRef.current = scene;
        window.THREE = THREE;
        window.__threeScene = scene;

        // Renderer with High Dynamic Range, Soft Shadows & Tone Mapping
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(lowQualityRef.current ? Math.min(window.devicePixelRatio, 1) : Math.min(Math.max(window.devicePixelRatio, 1.5), 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.VSMShadowMap;
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.style.visibility = 'hidden';
        setLightingReady(false);
        setFrameReady(false);
        rendererRef.current = renderer;
        window.__threeRenderer = renderer;
        const viewportShadowLight = createViewportShadowLight();
        viewportShadowLight.target.isStageElement = true;
        scene.add(viewportShadowLight, viewportShadowLight.target);

        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        let disposed = false, highQualityResources = null, highQualityPromise = null;
        highQualitySetupRef.current = () => {
            if (highQualityPromise) return highQualityPromise;
            highQualityPromise = import('./viewportHighQuality.js').then(async ({ createHighQualityViewport }) => {
                if (disposed) return;
                highQualityResources = createHighQualityViewport({ renderer, scene, camera, refs, antiAliasingStrength });
                await highQualityResources.ready;
                if (!disposed) { scene.userData.lightingReady = true; setLightingReady(true); }
            }).catch(error => {
                highQualityPromise = null;
                console.warn('High quality unavailable; keeping lightweight preview.', error);
                if (!disposed) { scene.userData.lightingFallback = true; scene.userData.lightingReady = true; setLightingReady(true); }
            });
            return highQualityPromise;
        };
        highQualitySetupRef.current();
        setRenderStatus('Preparing lighting');

        // Realistic Studio Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        scene.add(ambientLight);
        ambientLightRef.current = ambientLight;

        const keyLight = new THREE.DirectionalLight(0xfffbf2, 2.2);
        keyLight.position.set(3200, 5600, 3800);
        const lightTarget = new THREE.Object3D();
        lightTarget.position.set(DEFAULT_CENTER.x, 0, 0);
        scene.add(lightTarget);
        keyLight.target = lightTarget;
        lightTargetRef.current = lightTarget;
        keyLightRef.current = keyLight;

        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 4096;
        keyLight.shadow.mapSize.height = 4096;
        keyLight.shadow.camera.near = 500;
        keyLight.shadow.camera.far = 18000;
        const shRange = 5000;
        keyLight.shadow.camera.left = -shRange;
        keyLight.shadow.camera.right = shRange;
        keyLight.shadow.camera.top = shRange;
        keyLight.shadow.camera.bottom = -shRange;
        keyLight.shadow.bias = -0.0001;
        keyLight.shadow.normalBias = 0.03;
        keyLight.shadow.radius = 2.0;
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xe8f0fc, 1.2);
        fillLight.position.set(-3500, 3500, -2000);
        scene.add(fillLight);
        fillLightRef.current = fillLight;

        const rimLight = new THREE.DirectionalLight(0xfffaea, 1.4);
        rimLight.position.set(1200, 3800, -4800);
        scene.add(rimLight);
        rimLightRef.current = rimLight;

        const bounceLight = new THREE.DirectionalLight(0xf0f4f8, 0.5);
        bounceLight.position.set(DEFAULT_CENTER.x, -2000, 1500);
        scene.add(bounceLight);

        // Studio Camera with natural telephoto perspective (FOV 34 deg for showroom, 45 deg for Cornell)
        const camera = new THREE.PerspectiveCamera(34, w / h, 50, 40000);
        camera.position.set(2900, 2400, 5800);
        camera.lookAt(DEFAULT_CENTER);
        cameraRef.current = camera;
        window.__threeCamera = cameraRef;

        const controls = new OrbitControls(camera, renderer.domElement);
        const markCameraInteraction = () => {
            cameraUserControlledRef.current = true;
            hasFramedCameraRef.current = true;
            cameraAnimRef.current.active = false;
        };
        controls.addEventListener('start', markCameraInteraction);
        controls.enablePan = true;
        controls.panSpeed = 1.0;
        controls.minDistance = 600;
        controls.maxDistance = 18000;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.target.copy(DEFAULT_CENTER);
        controls.autoRotate = false;
        controls.autoRotateSpeed = 1.2;
        controlsRef.current = controls;
        window.__threeControls = controlsRef;

        // Showroom Stage Floor (ShadowMaterial)
        const shadowFloorGeo = new THREE.PlaneGeometry(24000, 24000);
        const shadowFloorMat = createPBRMaterial('blank_white');
        const shadowFloor = new THREE.Mesh(shadowFloorGeo, shadowFloorMat);
        shadowFloor.rotation.x = -Math.PI / 2;
        shadowFloor.position.y = 0;
        shadowFloor.receiveShadow = true;
        shadowFloor.isStageElement = true;
        shadowFloor.name = 'ground_plane';
        const shadowOverlay = new THREE.Mesh(shadowFloorGeo, new THREE.ShadowMaterial({ color: 0x000000, opacity: .24, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
        shadowOverlay.name = 'ground_shadow_overlay';
        shadowOverlay.position.z = 2;
        shadowOverlay.material.opacity = 0;
        shadowOverlay.receiveShadow = true;
        shadowOverlay.renderOrder = 1;
        shadowFloor.add(shadowOverlay);

        shadowFloor.userData.partKey = 'ground';
        shadowFloor.userData.elementKey = 'ground::plane';
        shadowFloor.visible = (studioTheme !== 'cornell');
        scene.add(shadowFloor);
        shadowFloorRef.current = shadowFloor;
        const blueprintGrid = new THREE.GridHelper(30000, 120, 0x38bdf8, 0x244567);
        blueprintGrid.name = 'blueprint_ground_grid';
        blueprintGrid.position.y = 3;
        blueprintGrid.isStageElement = true;
        blueprintGrid.visible = studioTheme === 'blueprint';
        scene.add(blueprintGrid);
        blueprintGridRef.current = blueprintGrid;

        // Selection Highlight Box
        const selectionBox = new THREE.Box3Helper(new THREE.Box3(), 0x38bdf8);
        selectionBox.material.depthTest = false;
        selectionBox.material.toneMapped = false;
        selectionBox.renderOrder = 10000;
        selectionBox.material.transparent = true;
        selectionBox.material.opacity = 0.85;
        selectionBox.visible = false;
        selectionBox.isStageElement = true;
        selectionBox.userData.isEditorHelper = true;
        scene.add(selectionBox);
        selectionBoxRef.current = selectionBox;

        // 3D 3-Axis Transform Gizmo (3ds Max style XYZ Translate)
        const transformControls = new TransformControls(camera, renderer.domElement);
        transformControls.setMode(gizmoMode || 'translate');
        transformControls.setRotationSnap(Math.PI / 2);
        transformControls.size = gizmoSize || 0.85;
        transformControls.space = 'world';
        const tcHelper = transformControls.getHelper();
        tcHelper.isStageElement = true;
        tcHelper.userData.isEditorHelper = true;
        scene.add(tcHelper);
        transformControlsRef.current = transformControls;

        transformControls.addEventListener('dragging-changed', (event) => {
            if (event.value) beginMoveEdit();
            else endMoveEdit();
            isDraggingGizmoRef.current = event.value;
            if (controlsRef.current) {
                controlsRef.current.enabled = !event.value;
            }
        });

        transformControls.addEventListener('objectChange', () => {
            const attached = transformControls.object;
            if (attached && attached.userData?.partKey) {
                const key = attached.userData.partKey;
                if (transformControls.mode === 'rotate') {
                    const initial = attached.userData.baseRotation || [0, 0, 0];
                    updatePartRotation(key, Object.fromEntries(['x', 'y', 'z'].map((axis, index) => [axis, Math.round((THREE.MathUtils.radToDeg(attached.rotation[axis]) - initial[index]) * 10) / 10])));
                    return;
                }
                const base = basePositionsRef.current[key] || { x: 0, y: 0, z: 0 };
                const newOffset = {
                    x: Math.round(attached.position.x - base.x - (attached.userData.modelOffset?.x || 0)),
                    y: Math.round(attached.position.y - base.y - (attached.userData.modelOffset?.y || 0)),
                    z: Math.round(attached.position.z - base.z - (attached.userData.modelOffset?.z || 0))
                };
                setPartOffsetFull(key, newOffset);
            }
        });

        // =========================================================================
        // REALTIME PATH TRACING CORNELL BOX ENVIRONMENT (Matching Domenicobrz)
        // Proportions: boxW=7000, boxH=7000, boxD=7000 centered at (cx, 3500, 0)
        // Left: Green, Right: Red, Back/Floor/Ceiling: White, Ceiling Downlight Emitter
        // =========================================================================
        createCornellEnvironment({ refs, scene, lightTarget });

        // Textures
        const texLoader = new THREE.TextureLoader();
        const tubeTex = texLoader.load('/models/logo_tube.jpg');
        tubeTex.colorSpace = THREE.SRGBColorSpace;
        texturesRef.current = { tubeTex };

        // Raycasting: Click to select part on 3D Canvas
        const onPointerDown = (e) => {
            pointerStartRef.current = { x: e.clientX, y: e.clientY };
        };

        const onPointerUp = (e) => {
            if (!sceneEditRef.current?.adminMode) return;
            if (isDraggingGizmoRef.current || transformControlsRef.current?.dragging) return;
            const dx = Math.abs(e.clientX - pointerStartRef.current.x);
            const dy = Math.abs(e.clientY - pointerStartRef.current.y);
            if (dx > 6 || dy > 6) return;

            if (!containerRef.current || !rendererRef.current || !cameraRef.current || !sceneRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, cameraRef.current);

            const selectable = [];
            sceneRef.current.traverse((child) => {
                if (child.isMesh && child.visible && (!child.isStageElement || child.userData.partKey === 'ground') && !child.isSprite && !child.isLineSegments && child.userData?.partKey) {
                    selectable.push(child);
                }
            });

            const intersects = raycaster.intersectObjects(selectable, false);
            if (!intersects.length) { setSelectedPart(''); setSelectedElement(''); }
            if (intersects.length > 0) {
                const hitKey = intersects[0].object.userData.partKey;
                if (hitKey) {
                    setSelectedPart(hitKey);
                    setSelectedElement(intersects[0].object.userData.elementKey || '');
                    if (sceneEditRef.current.adminMode) setActiveLeftTab('component-materials');
                    setClickedPin({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        partKey: hitKey
                    });
                }
            }
        };

        const domElem = renderer.domElement;
        domElem.addEventListener('pointerdown', onPointerDown);
        domElem.addEventListener('pointerup', onPointerUp);

        const stopAnimation = startViewportLoop({ refs, camera, controls, trackCamera, setCameraTelemetry, renderer, scene, setRenderStatus, onFrameReady: () => setFrameReady(true) });

        // ResizeObserver
        const viewportSize = new THREE.Vector2(w, h);
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0 && cameraRef.current && rendererRef.current) {
                    if (Math.round(viewportSize.x) === Math.round(width) && Math.round(viewportSize.y) === Math.round(height)) continue;
                    viewportSize.set(width, height);
                    cameraRef.current.aspect = width / height;
                    cameraRef.current.updateProjectionMatrix();
                    rendererRef.current.setSize(width, height, false);
                    composerRef.current?.setSize(width, height);
                }
            }
        });
        resizeObserver.observe(container);

        // Paint the viewport without waiting for the model catalog.
        isReadyRef.current = true;
        setViewportGeneration(value => value + 1);

        return () => {
            disposed = true;
            highQualitySetupRef.current = null;
            highQualityResources?.dispose();
            isReadyRef.current = false;
            modelRequestsRef.current.clear();
            stopAnimation();
            resizeObserver.disconnect();
            domElem.removeEventListener('pointerdown', onPointerDown);
            domElem.removeEventListener('pointerup', onPointerUp);
            transformControls.dispose();
            controls.removeEventListener('start', markCameraInteraction);
            controls.dispose();
            antiAliasingPassRef.current = null;
            composerRef.current = null;
            renderer.dispose();
            studioRendererRef.current?.dispose(); studioRendererRef.current = null;
            hdrSSRRef.current?.dispose(); hdrSSRRef.current = null;
            exportAbortRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (!lowQuality) highQualitySetupRef.current?.();
    }, [lowQuality]);
}

