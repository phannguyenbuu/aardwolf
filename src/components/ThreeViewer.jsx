import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import download from 'downloadjs';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';
import { ALL_PRELOAD_ITEMS, mmToInch } from '../constants/data.js';
import { PBR_MATERIALS, PART_LABELS, PART_ICONS, createPBRMaterial } from '../constants/pbrMaterials.js';

function extractPoint3(inputString) {
    const p1Match = inputString.match(/p1_(-?\d+)_(-?\d+)_(-?\d+)/);
    const p2Match = inputString.match(/p2_(-?\d+)_(-?\d+)_(-?\d+)/);

    const parsePoint = (match) => {
        if (!match) return null;
        return {
            x: parseFloat(match[1]),
            y: parseFloat(match[2]),
            z: parseFloat(match[3]),
        };
    };

    return [parsePoint(p1Match), parsePoint(p2Match)];
}

const TUBE_OFFSET = 25.5;

// Default equipment center fallback
const DEFAULT_CENTER = new THREE.Vector3(1130, 1200, 0);

function createDimensionSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // Rounded rectangle badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(4, 4, 312, 72, 12);
    ctx.fill();
    ctx.stroke();

    // Text callout
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Open Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 160, 40);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(420, 105, 1);
    return sprite;
}

export default function ThreeViewer() {
    const containerRef = useRef(null);
    const {
        config3D,
        actualLoad,
        unit,
        surfaceType,
        setPdfContent,
        setIs3DLoading,
        setLoadingProgress,
        cameraPresetTrigger,
        setCameraPresetTrigger,
        takeSnapshotRef,
        show3DModal,
        setShow3DModal,
        viewportMode,
        setViewportMode,
        studioTheme,
        setStudioTheme,
        workLoadLimit,
        craneType,
        selectedPart,
        setSelectedPart,
        setActiveLeftTab,
        componentMaterials,
        customParams,
        downlightEnabled,
        downlightIntensity,
        downlightColorTemp,
        cornellLeftColor,
        cornellRightColor,
        cornellBleedIntensity,
        sceneLights,
        showSpecsHUD,
        setShowSpecsHUD,
        isTurntableActive,
        setIsTurntableActive,
        isExporting,
        setIsExporting,
        exportRenderTrigger,
        setCameraTelemetry
    } = useConfigurator();

    const [clickedPin, setClickedPin] = useState(null);

    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const loadedObjectsMapRef = useRef(new Map());
    const isReadyRef = useRef(false);
    const workpieceGroupRef = useRef(null);
    const texturesRef = useRef({});
    const currentCenterRef = useRef(DEFAULT_CENTER.clone());
    const currentSizeRef = useRef(new THREE.Vector3(3300, 2600, 1000));
    const lightTargetRef = useRef(null);
    const edgeLineMatRef = useRef(null);

    // Studio lights refs
    const keyLightRef = useRef(null);
    const ambientLightRef = useRef(null);
    const fillLightRef = useRef(null);
    const rimLightRef = useRef(null);
    const shadowFloorRef = useRef(null);

    // Cornell Box specific scene elements
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

    // Camera animation refs
    const cameraAnimRef = useRef({
        active: false,
        startPos: new THREE.Vector3(),
        endPos: new THREE.Vector3(),
        startTarget: new THREE.Vector3(),
        endTarget: new THREE.Vector3(),
        startTime: null,
        duration: 0.8
    });

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
                rendererRef.current.render(sceneRef.current, cameraRef.current);
                const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
                resolve(dataUrl);
            });
        };
    }, [takeSnapshotRef]);

    // Initialize Three.js scene
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;

        const scene = new THREE.Scene();
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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x000000, 0);
        rendererRef.current = renderer;
        window.__threeRenderer = renderer;

        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // Studio HDRI Environment Map via PMREMGenerator & RoomEnvironment
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const roomEnvironment = new RoomEnvironment();
        scene.environment = pmremGenerator.fromScene(roomEnvironment).texture;

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
        const shadowFloorMat = new THREE.ShadowMaterial({
            opacity: 0.18,
            depthWrite: false
        });
        const shadowFloor = new THREE.Mesh(shadowFloorGeo, shadowFloorMat);
        shadowFloor.rotation.x = -Math.PI / 2;
        shadowFloor.position.y = 0;
        shadowFloor.receiveShadow = true;
        shadowFloor.isStageElement = true;
        shadowFloor.visible = (studioTheme !== 'cornell');
        scene.add(shadowFloor);
        shadowFloorRef.current = shadowFloor;

        // Selection Highlight Box
        const selectionBox = new THREE.Box3Helper(new THREE.Box3(), 0x38bdf8);
        selectionBox.material.depthTest = false;
        selectionBox.material.transparent = true;
        selectionBox.material.opacity = 0.85;
        selectionBox.visible = false;
        selectionBox.isStageElement = true;
        scene.add(selectionBox);
        selectionBoxRef.current = selectionBox;

        // =========================================================================
        // REALTIME PATH TRACING CORNELL BOX ENVIRONMENT (Matching Domenicobrz)
        // Proportions: boxW=7000, boxH=7000, boxD=7000 centered at (cx, 3500, 0)
        // Left: Green, Right: Red, Back/Floor/Ceiling: White, Ceiling Downlight Emitter
        // =========================================================================
        const cornellGroup = new THREE.Group();
        cornellGroup.name = 'cornell_box';
        cornellGroup.isStageElement = true;
        cornellGroup.visible = true;
        cornellGroupRef.current = cornellGroup;

        const boxW = 7000;
        const boxH = 7000;
        const boxD = 7000;
        const cx = DEFAULT_CENTER.x;
        const cy = boxH / 2;
        const cz = 0;

        // 1. Green Left Wall
        const greenWallGeo = new THREE.PlaneGeometry(boxD, boxH);
        const greenWallMat = new THREE.MeshStandardMaterial({
            color: 0x1caa28,
            roughness: 0.82,
            metalness: 0.01,
            side: THREE.DoubleSide
        });
        const greenWall = new THREE.Mesh(greenWallGeo, greenWallMat);
        greenWall.position.set(cx - (boxW / 2), cy, cz);
        greenWall.rotation.y = Math.PI / 2;
        greenWall.receiveShadow = true;
        greenWall.isStageElement = true;
        cornellGroup.add(greenWall);
        cornellLeftWallMatRef.current = greenWallMat;

        // 2. Red Right Wall
        const redWallGeo = new THREE.PlaneGeometry(boxD, boxH);
        const redWallMat = new THREE.MeshStandardMaterial({
            color: 0xe6261f,
            roughness: 0.82,
            metalness: 0.01,
            side: THREE.DoubleSide
        });
        const redWall = new THREE.Mesh(redWallGeo, redWallMat);
        redWall.position.set(cx + (boxW / 2), cy, cz);
        redWall.rotation.y = -Math.PI / 2;
        redWall.receiveShadow = true;
        redWall.isStageElement = true;
        cornellGroup.add(redWall);
        cornellRightWallMatRef.current = redWallMat;

        // 3. Back White Wall
        const backWallGeo = new THREE.PlaneGeometry(boxW, boxH);
        const backWallMat = new THREE.MeshStandardMaterial({
            color: 0xf0f0f0,
            roughness: 0.85,
            metalness: 0.01,
            side: THREE.DoubleSide
        });
        const backWall = new THREE.Mesh(backWallGeo, backWallMat);
        backWall.position.set(cx, cy, cz - (boxD / 2));
        backWall.receiveShadow = true;
        backWall.isStageElement = true;
        cornellGroup.add(backWall);
        cornellBackWallMatRef.current = backWallMat;

        // 4. White Floor (extended forward towards camera for seamless horizon)
        const cornellFloorGeo = new THREE.PlaneGeometry(boxW * 1.5, boxD * 2.5);
        const cornellFloorMat = new THREE.MeshStandardMaterial({
            color: 0xe5e5e5,
            roughness: 0.72,
            metalness: 0.02,
            side: THREE.DoubleSide
        });
        const cornellFloor = new THREE.Mesh(cornellFloorGeo, cornellFloorMat);
        cornellFloor.position.set(cx, 1, cz + (boxD * 0.75));
        cornellFloor.rotation.x = -Math.PI / 2;
        cornellFloor.receiveShadow = true;
        cornellFloor.isStageElement = true;
        cornellGroup.add(cornellFloor);
        cornellFloorMatRef.current = cornellFloorMat;

        // 5. White Ceiling
        const ceilingGeo = new THREE.PlaneGeometry(boxW, boxD);
        const ceilingMat = new THREE.MeshStandardMaterial({
            color: 0xfafafa,
            roughness: 0.85,
            side: THREE.DoubleSide
        });
        const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceilingMesh.position.set(cx, boxH, cz);
        ceilingMesh.rotation.x = Math.PI / 2;
        ceilingMesh.isStageElement = true;
        cornellGroup.add(ceilingMesh);
        cornellCeilingMatRef.current = ceilingMat;

        // 6. Ceiling Emitter Panel
        const emitterSize = boxW * 0.65;
        const emitterGeo = new THREE.PlaneGeometry(emitterSize, emitterSize);
        const emitterMat = new THREE.MeshBasicMaterial({
            color: 0xfff6dc,
            side: THREE.DoubleSide
        });
        const emitterMesh = new THREE.Mesh(emitterGeo, emitterMat);
        emitterMesh.position.set(cx, boxH - 12, cz);
        emitterMesh.rotation.x = Math.PI / 2;
        emitterMesh.isStageElement = true;
        cornellGroup.add(emitterMesh);
        cornellEmitterMatRef.current = emitterMat;

        scene.add(cornellGroup);

        // Downward soft ceiling light (No shadow acne, smooth penumbra)
        const cornellCeilingLight = new THREE.SpotLight(0xfff6dc, 4.8);
        cornellCeilingLight.position.set(cx, boxH - 40, cz);
        cornellCeilingLight.target = lightTarget;
        cornellCeilingLight.angle = Math.PI / 2.8;
        cornellCeilingLight.penumbra = 0.85;
        cornellCeilingLight.castShadow = false; // Default false - user can toggle in lighting panel
        cornellCeilingLight.shadow.mapSize.width = 2048;
        cornellCeilingLight.shadow.mapSize.height = 2048;
        cornellCeilingLight.shadow.camera.near = 100;
        cornellCeilingLight.shadow.camera.far = 12000;
        cornellCeilingLight.shadow.bias = -0.0001;
        cornellCeilingLight.shadow.normalBias = 0.03;
        scene.add(cornellCeilingLight);
        cornellCeilingLightRef.current = cornellCeilingLight;

        // Green left bounce
        const cornellGreenBounce = new THREE.DirectionalLight(0x1caa28, 1.4);
        cornellGreenBounce.position.set(cx - (boxW / 2) + 400, cy, cz);
        cornellGreenBounce.target = lightTarget;
        scene.add(cornellGreenBounce);
        cornellGreenBounceRef.current = cornellGreenBounce;

        // Red right bounce
        const cornellRedBounce = new THREE.DirectionalLight(0xe6261f, 1.4);
        cornellRedBounce.position.set(cx + (boxW / 2) - 400, cy, cz);
        cornellRedBounce.target = lightTarget;
        scene.add(cornellRedBounce);
        cornellRedBounceRef.current = cornellRedBounce;

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
                if (child.isMesh && !child.isStageElement && !child.isSprite && !child.isLineSegments && child.userData?.partKey) {
                    selectable.push(child);
                }
            });

            const intersects = raycaster.intersectObjects(selectable, false);
            if (intersects.length > 0) {
                const hitKey = intersects[0].object.userData.partKey;
                if (hitKey) {
                    setSelectedPart(hitKey);
                    setActiveLeftTab('component-materials');
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

        // Animation loop
        let lastTelemetryTime = 0;
        let animationFrameId;
        const animate = (timestamp) => {
            animationFrameId = requestAnimationFrame(animate);

            const anim = cameraAnimRef.current;
            if (anim.active) {
                if (!anim.startTime) anim.startTime = timestamp;
                const elapsed = (timestamp - anim.startTime) / 1000;
                const progress = Math.min(elapsed / anim.duration, 1);
                const ease = 0.5 - Math.cos(progress * Math.PI) / 2;

                camera.position.lerpVectors(anim.startPos, anim.endPos, ease);
                controls.target.lerpVectors(anim.startTarget, anim.endTarget, ease);

                if (progress >= 1) {
                    anim.active = false;
                    anim.startTime = null;
                }
            }

            if (controls) {
                controls.update();
            }

            // Real-time camera telemetry
            if (timestamp - lastTelemetryTime > 120) {
                lastTelemetryTime = timestamp;
                const p = camera.position;
                const t = controls.target;
                const dist = Math.round(p.distanceTo(t));
                const delta = new THREE.Vector3().subVectors(p, t);
                const spherical = new THREE.Spherical().setFromVector3(delta);
                const azimuth = Math.round((spherical.theta * 180) / Math.PI);
                const elevation = Math.round(90 - (spherical.phi * 180) / Math.PI);

                let presetName = 'Custom';
                if (Math.abs(azimuth) < 10 && Math.abs(elevation) < 10 && Math.abs(p.z - 9600) < 1000) presetName = 'Cornell Reference';
                else if (Math.abs(azimuth) < 15 && Math.abs(elevation) < 15) presetName = 'Front';
                else if (elevation > 70) presetName = 'Top';
                else if (Math.abs(Math.abs(azimuth) - 90) < 15) presetName = 'Side';
                else if (Math.abs(azimuth - 45) < 25 && elevation > 12 && elevation < 45) presetName = 'Isometric';

                setCameraTelemetry({
                    posX: Math.round(p.x),
                    posY: Math.round(p.y),
                    posZ: Math.round(p.z),
                    targetX: Math.round(t.x),
                    targetY: Math.round(t.y),
                    targetZ: Math.round(t.z),
                    distance: dist,
                    fov: Math.round(camera.fov),
                    azimuth,
                    elevation,
                    preset: presetName
                });
            }

            // Direct smooth PBR rendering - zero depth staircasing, zero horizontal stripes!
            renderer.render(scene, camera);
        };
        animate();

        // ResizeObserver
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0 && cameraRef.current && rendererRef.current) {
                    cameraRef.current.aspect = width / height;
                    cameraRef.current.updateProjectionMatrix();
                    rendererRef.current.setSize(width, height, false);
                }
            }
        });
        resizeObserver.observe(container);

        // Preload FBX models
        setIs3DLoading(true);
        const fbxLoader = new FBXLoader();
        const edgeLineMat = new THREE.LineBasicMaterial({
            color: 0x1e2228,
            transparent: true,
            opacity: 0.35,
            linewidth: 1
        });
        edgeLineMatRef.current = edgeLineMat;

        const preloadPromises = ALL_PRELOAD_ITEMS.map((item) => {
            const fileName = `/models/aardwolf_all_part_${item.name}.fbx`;
            return new Promise((resolve) => {
                fbxLoader.load(
                    fileName,
                    (object) => {
                        object.name = item.name;
                        object.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                child.userData.origGeometry = child.geometry;
                            }
                        });
                        loadedObjectsMapRef.current.set(item.name, object);
                        resolve();
                    },
                    (xhr) => {
                        if (xhr.total > 0) {
                            setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 100));
                        }
                    },
                    (err) => {
                        console.error('FBX Load error:', fileName, err);
                        resolve();
                    }
                );
            });
        });

        Promise.all(preloadPromises).then(() => {
            isReadyRef.current = true;
            setIs3DLoading(false);
            update3DScene();
        });

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
            domElem.removeEventListener('pointerdown', onPointerDown);
            domElem.removeEventListener('pointerup', onPointerUp);
            renderer.dispose();
            pmremGenerator.dispose();
            roomEnvironment.dispose();
        };
    }, []);

    // Apply PBR Materials to components
    const applyComponentMaterials = useCallback((mats, overrides) => {
        const scene = sceneRef.current;
        if (!scene || !isReadyRef.current) return;

        scene.traverse((child) => {
            if (child.isMesh && !child.isStageElement && !child.isSprite && !child.isLineSegments) {
                const partKey = child.userData?.partKey;
                if (partKey && mats[partKey]) {
                    const matId = mats[partKey];
                    const customOverride = overrides[partKey] || null;
                    const pbrMat = createPBRMaterial(matId, customOverride);

                    if (partKey === 'tube' && texturesRef.current.tubeTex) {
                        pbrMat.map = texturesRef.current.tubeTex;
                        pbrMat.needsUpdate = true;
                    }

                    child.material = pbrMat;
                }
            }
        });
    }, []);

    // Reapply materials whenever componentMaterials or customParams change
    useEffect(() => {
        if (isReadyRef.current) {
            applyComponentMaterials(componentMaterials, customParams);
        }
    }, [componentMaterials, customParams, applyComponentMaterials]);

    // Update 3D Scene models
    const update3DScene = useCallback(() => {
        const scene = sceneRef.current;
        if (!scene || !isReadyRef.current) return;

        // Clear existing models except lights and stage elements
        for (let i = scene.children.length - 1; i >= 0; i--) {
            const child = scene.children[i];
            if (!child.isLight && !child.isAxesHelper && !child.isStageElement) {
                scene.remove(child);
            }
        }

        const { crane, pumpGroup, tube, headStack, suctionPack } = config3D;

        const addToScene = (targetScene, objectName, position, rotation, partKey) => {
            const proto = loadedObjectsMapRef.current.get(objectName);
            if (!proto) return null;
            const clone = proto.clone(true);
            if (position) clone.position.set(position.x, position.y, position.z);
            if (rotation) clone.rotation.set(rotation.x, rotation.y, rotation.z);

            clone.traverse((child) => {
                if (child.isMesh) {
                    child.userData.partKey = partKey;
                    const matId = componentMaterials[partKey] || 'steel_brushed';
                    const customOverride = customParams[partKey] || null;
                    child.material = createPBRMaterial(matId, customOverride);
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            targetScene.add(clone);
            return clone;
        };

        if (crane) addToScene(scene, crane.name, null, null, 'crane');
        if (pumpGroup) addToScene(scene, pumpGroup.name, null, null, 'pump');

        if (crane && tube && headStack && suctionPack) {
            const [p1, p2] = extractPoint3(crane.name);
            if (p2) {
                const tubeMesh = addToScene(scene, tube.name, {
                    x: p2.x,
                    y: p2.y,
                    z: p2.z - TUBE_OFFSET
                }, null, 'tube');

                if (tubeMesh && texturesRef.current.tubeTex) {
                    tubeMesh.traverse((child) => {
                        if (child.isMesh) {
                            child.material.map = texturesRef.current.tubeTex;
                            child.material.needsUpdate = true;
                        }
                    });
                }

                const tubeHeight = 1200;
                const pad = {
                    x: p2.x,
                    y: p2.y,
                    z: p2.z - tubeHeight - headStack.y
                };

                addToScene(scene, headStack.name, pad, null, 'head');
                addToScene(scene, suctionPack.name, pad, null, 'suction');

                // Workpiece
                const workpieceGroup = new THREE.Group();
                workpieceGroupRef.current = workpieceGroup;

                const l = Math.max(50, actualLoad.length);
                const w = Math.max(50, actualLoad.width);
                const h = Math.max(20, actualLoad.height);

                const boxGeo = new THREE.BoxGeometry(l, h, w);
                const wpMatId = componentMaterials.workpiece || 'aluminum_brushed';
                const wpMat = createPBRMaterial(wpMatId, customParams.workpiece);
                const workpieceMesh = new THREE.Mesh(boxGeo, wpMat);
                workpieceMesh.userData.partKey = 'workpiece';
                workpieceMesh.castShadow = true;
                workpieceMesh.receiveShadow = true;

                const workpieceCenterY = pad.z - (h / 2);
                workpieceMesh.position.set(pad.x, workpieceCenterY, pad.y);
                workpieceGroup.add(workpieceMesh);

                const edgesGeo = new THREE.EdgesGeometry(boxGeo);
                const edgesMat = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 });
                const wireframe = new THREE.LineSegments(edgesGeo, edgesMat);
                wireframe.position.copy(workpieceMesh.position);
                workpieceGroup.add(wireframe);

                const dimText = unit === 'Inch'
                    ? `${Math.round(mmToInch(l))}" × ${Math.round(mmToInch(w))}"`
                    : `${l} × ${w} mm`;
                const sprite = createDimensionSprite(dimText);
                sprite.position.set(pad.x, workpieceCenterY, pad.y + (w / 2) + 140);
                workpieceGroup.add(sprite);

                scene.add(workpieceGroup);

                // Auto bounding box
                const bbox = new THREE.Box3();
                scene.traverse((child) => {
                    if (child.isMesh && !child.isStageElement && !child.isSprite && !child.isLineSegments) {
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

                    if (controlsRef.current && cameraRef.current) {
                        controlsRef.current.target.copy(center);
                        const span = Math.max(size.x, size.y, 3000);
                        const camDist = Math.max(5400, span * 1.55);

                        if (studioTheme === 'cornell') {
                            // Lock into Cornell Box reference perspective
                            cameraRef.current.fov = 45;
                            cameraRef.current.position.set(center.x, 3200, 9600);
                            controlsRef.current.target.set(center.x, 3200, 0);
                        } else {
                            cameraRef.current.fov = 34;
                            cameraRef.current.position.set(center.x + (span * 0.45), center.y + (span * 0.38), camDist);
                        }
                        cameraRef.current.updateProjectionMatrix();
                        controlsRef.current.update();
                    }
                }
            }
        }
    }, [config3D, actualLoad, unit, componentMaterials, customParams, studioTheme]);

    useEffect(() => {
        if (isReadyRef.current) {
            update3DScene();
        }
    }, [config3D, actualLoad, unit, update3DScene]);

    // Sync Selection Box3Helper
    useEffect(() => {
        if (!selectionBoxRef.current || !sceneRef.current) return;
        const helper = selectionBoxRef.current;
        const box3 = helper.box;

        if (!selectedPart) {
            helper.visible = false;
            return;
        }

        box3.makeEmpty();
        if (selectedPart === 'workpiece') {
            if (workpieceGroupRef.current) {
                box3.setFromObject(workpieceGroupRef.current);
            }
        } else {
            sceneRef.current.traverse((child) => {
                if (child.isMesh && child.userData?.partKey === selectedPart && !child.isStageElement && !child.isLineSegments && !child.isSprite) {
                    box3.expandByObject(child);
                }
            });
        }
        helper.visible = !box3.isEmpty();
    }, [selectedPart, config3D]);

    // Handle Camera Presets trigger
    useEffect(() => {
        if (!cameraPresetTrigger || !cameraRef.current || !controlsRef.current) return;

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
            'ortho-view': { pos: new THREE.Vector3(center.x + (span * 0.45), center.y + (span * 0.38), Math.max(6000, span * 1.65)), target: center, fov: 34 },
            'focus-suction': { pos: new THREE.Vector3(padX + 900, 750, 1600), target: new THREE.Vector3(padX, 350, 0), fov: 32 }
        };

        const targetConfig = presets[cameraPresetTrigger];
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
    }, [cameraPresetTrigger, setCameraPresetTrigger, config3D, setIsTurntableActive]);

    // Theme & Lighting updates
    useEffect(() => {
        if (!sceneRef.current) return;

        const isCornell = studioTheme === 'cornell';

        // Toggle Cornell Room vs Studio Floor to prevent Z-Fighting
        if (cornellGroupRef.current) {
            cornellGroupRef.current.visible = isCornell;
        }
        if (shadowFloorRef.current) {
            shadowFloorRef.current.visible = !isCornell;
        }

        // Apply Custom Scene Lights
        if (sceneLights) {
            // 1. Key Light (Main Directional Light)
            if (keyLightRef.current) {
                keyLightRef.current.visible = sceneLights.keyLight.enabled;
                keyLightRef.current.intensity = sceneLights.keyLight.intensity;
                keyLightRef.current.color.set(sceneLights.keyLight.color);
                keyLightRef.current.castShadow = sceneLights.keyLight.castShadow;
                keyLightRef.current.position.set(
                    sceneLights.keyLight.posX,
                    sceneLights.keyLight.posY,
                    sceneLights.keyLight.posZ
                );
            }

            // 2. Ambient Light
            if (ambientLightRef.current) {
                ambientLightRef.current.intensity = sceneLights.ambientLight.intensity;
                ambientLightRef.current.color.set(sceneLights.ambientLight.color);
            }

            // 3. Fill Light
            if (fillLightRef.current) {
                fillLightRef.current.visible = sceneLights.fillLight.enabled;
                fillLightRef.current.intensity = sceneLights.fillLight.intensity;
                fillLightRef.current.color.set(sceneLights.fillLight.color);
            }

            // 4. Rim Light
            if (rimLightRef.current) {
                rimLightRef.current.visible = sceneLights.rimLight.enabled;
                rimLightRef.current.intensity = sceneLights.rimLight.intensity;
                rimLightRef.current.color.set(sceneLights.rimLight.color);
            }

            // 5. Downlight Emitter (Cornell Box SpotLight)
            if (cornellCeilingLightRef.current) {
                cornellCeilingLightRef.current.visible = isCornell && sceneLights.downlight.enabled;
                cornellCeilingLightRef.current.intensity = sceneLights.downlight.intensity;
                cornellCeilingLightRef.current.castShadow = sceneLights.downlight.castShadow;
                cornellCeilingLightRef.current.color.set(sceneLights.downlight.color || '#fff6dc');
                if (sceneLights.downlight.angle) {
                    cornellCeilingLightRef.current.angle = sceneLights.downlight.angle;
                }
                if (sceneLights.downlight.penumbra !== undefined) {
                    cornellCeilingLightRef.current.penumbra = sceneLights.downlight.penumbra;
                }
            }

            // 6. Camera Tone Mapping Exposure
            if (rendererRef.current && sceneLights.exposure) {
                rendererRef.current.toneMappingExposure = sceneLights.exposure;
            }
        }

        // Cornell Box Wall Materials & Emitter Visibility
        if (cornellEmitterMatRef.current) {
            cornellEmitterMatRef.current.visible = isCornell && (sceneLights?.downlight?.enabled ?? true);
        }
        if (cornellLeftWallMatRef.current) {
            cornellLeftWallMatRef.current.color.set(cornellLeftColor);
        }
        if (cornellRightWallMatRef.current) {
            cornellRightWallMatRef.current.color.set(cornellRightColor);
        }
        if (cornellGreenBounceRef.current) {
            cornellGreenBounceRef.current.visible = isCornell;
            cornellGreenBounceRef.current.color.set(cornellLeftColor);
            cornellGreenBounceRef.current.intensity = cornellBleedIntensity;
        }
        if (cornellRedBounceRef.current) {
            cornellRedBounceRef.current.visible = isCornell;
            cornellRedBounceRef.current.color.set(cornellRightColor);
            cornellRedBounceRef.current.intensity = cornellBleedIntensity;
        }
    }, [studioTheme, sceneLights, cornellLeftColor, cornellRightColor, cornellBleedIntensity]);

    // Handle high-resolution 4K Studio Render export
    const handleExportRender = useCallback(() => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !containerRef.current) return;
        setIsExporting(true);

        try {
            const renderer = rendererRef.current;
            const camera = cameraRef.current;
            const scene = sceneRef.current;
            const container = containerRef.current;

            const originalWidth = container.clientWidth;
            const originalHeight = container.clientHeight;
            const originalPixelRatio = renderer.getPixelRatio();

            // Render at true 4K resolution (3840 x 2160)
            const targetWidth = 3840;
            const targetHeight = 2160;

            renderer.setPixelRatio(1);
            renderer.setSize(targetWidth, targetHeight, false);
            camera.aspect = targetWidth / targetHeight;
            camera.updateProjectionMatrix();

            renderer.render(scene, camera);

            const dataUrl = renderer.domElement.toDataURL('image/png', 1.0);
            download(dataUrl, `Aardwolf_Vacuum_Lifter_Studio_Render_4K_${Date.now()}.png`, 'image/png');

            // Restore original dimensions
            renderer.setPixelRatio(originalPixelRatio);
            renderer.setSize(originalWidth, originalHeight, true);
            camera.aspect = originalWidth / originalHeight;
            camera.updateProjectionMatrix();
            renderer.render(scene, camera);
        } catch (e) {
            console.error('Export render error:', e);
        } finally {
            setTimeout(() => setIsExporting(false), 500);
        }
    }, [setIsExporting]);

    // Handle export trigger from Column 1
    useEffect(() => {
        if (exportRenderTrigger > 0) {
            handleExportRender();
        }
    }, [exportRenderTrigger, handleExportRender]);

    return (
        <div className={`three-viewport-wrapper theme-${studioTheme} mode-${viewportMode}`}>
            {/* Live Interactive Three.js WebGL Container */}
            <div
                id="threejs-container"
                ref={containerRef}
            />

            {/* Fullscreen Expand Button */}
            <button
                type="button"
                className="viewport-fullscreen-toggle"
                onClick={() => setShow3DModal(true)}
                title="Phóng to toàn màn hình"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
            </button>

            {/* Floating Technical Specs HUD */}
            {viewportMode === 'studio-render' && showSpecsHUD && (
                <div className="studio-specs-hud">
                    <div className="specs-hud-header">
                        <span className="specs-brand">AARDWOLF VACUUM LIFTER</span>
                        <span className="specs-status">STUDIO HD</span>
                    </div>
                    <div className="specs-hud-body">
                        <div className="specs-item">
                            <span className="specs-lbl">Configuration:</span>
                            <span className="specs-val">{config3D.crane ? config3D.crane.name.split('@')[0] : 'Jib Crane'}</span>
                        </div>
                        <div className="specs-item">
                            <span className="specs-lbl">Capacity:</span>
                            <span className="specs-val font-weight-bold">{workLoadLimit.toUpperCase()}</span>
                        </div>
                        <div className="specs-item">
                            <span className="specs-lbl">Workpiece:</span>
                            <span className="specs-val">{actualLoad.length} × {actualLoad.width} × {actualLoad.height} mm ({actualLoad.weight} kg)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 3D Click Pin Feedback */}
            {clickedPin && (
                <div
                    className="lumion-click-pin"
                    style={{ left: `${clickedPin.x}px`, top: `${clickedPin.y}px` }}
                >
                    <div className="pin-pulse-ring" />
                    <div className="pin-marker-pill">
                        <span className="pin-icon">{PART_ICONS[clickedPin.partKey]}</span>
                        <span className="pin-label">{PART_LABELS[clickedPin.partKey]}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
