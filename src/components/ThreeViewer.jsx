import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';
import { ALL_PRELOAD_ITEMS, mmToInch } from '../constants/data.js';

function extractPoint3(inputString) {
    const p1Match = inputString.match(/p1_(-?\d+)_(-?\d+)_(-?\d+)/);
    const p2Match = inputString.match(/p2_(-?\d+)_(-?\d+)_(-?\d+)/);

    let p1 = { x: 0, y: 0, z: 0 };
    let p2 = { x: 0, y: 0, z: 0 };
    if (p1Match && p2Match) {
        p1 = { x: parseFloat(p1Match[1]), y: parseFloat(p1Match[2]), z: parseFloat(p1Match[3]) };
        p2 = { x: parseFloat(p2Match[1]), y: parseFloat(p2Match[2]), z: parseFloat(p2Match[3]) };
    }
    return [p1, p2];
}

const TUBE_HEIGHT = 1918.86;
const TUBE_OFFSET = 25.5;

// Default equipment center fallback
const DEFAULT_CENTER = new THREE.Vector3(1130, 1200, 0);

function createDimensionSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // High-contrast modern dark pill badge
    ctx.fillStyle = '#0f172a';
    ctx.roundRect(4, 4, 312, 72, 18);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.roundRect(4, 4, 312, 72, 18);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px "Open Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 160, 40);

    const texture = new THREE.CanvasTexture(canvas);
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
        setShow3DModal
    } = useConfigurator();

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

    // Initialize Three.js scene with Photorealistic PBR Studio Setup
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
        renderer.toneMappingExposure = 1.18;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.setClearColor(0x000000, 0); // Transparent canvas on top of studio gradient
        rendererRef.current = renderer;
        window.__threeRenderer = renderer;

        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // Studio HDRI Environment Map via PMREMGenerator & RoomEnvironment
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const roomEnvironment = new RoomEnvironment();
        scene.environment = pmremGenerator.fromScene(roomEnvironment).texture;

        // Realistic Four-Point Industrial Studio Lighting
        // 1. Ambient baseline
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        scene.add(ambientLight);

        // 2. Key light with realistic diffused contact shadow
        const keyLight = new THREE.DirectionalLight(0xfffbf2, 2.4);
        keyLight.position.set(3200, 5600, 3800);
        const lightTarget = new THREE.Object3D();
        lightTarget.position.set(1130, 0, 0);
        scene.add(lightTarget);
        keyLight.target = lightTarget;
        lightTargetRef.current = lightTarget;

        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 4096;
        keyLight.shadow.mapSize.height = 4096;
        keyLight.shadow.camera.near = 500;
        keyLight.shadow.camera.far = 16000;
        const shRange = 4800;
        keyLight.shadow.camera.left = -shRange;
        keyLight.shadow.camera.right = shRange;
        keyLight.shadow.camera.top = shRange;
        keyLight.shadow.camera.bottom = -shRange;
        keyLight.shadow.bias = -0.0002;
        keyLight.shadow.radius = 3.2;
        scene.add(keyLight);

        // 3. Cool sky fill light to soften dark recesses
        const fillLight = new THREE.DirectionalLight(0xe8f0fc, 1.2);
        fillLight.position.set(-3500, 3500, -2000);
        scene.add(fillLight);

        // 4. Warm rim light to accent structural bevels and edges
        const rimLight = new THREE.DirectionalLight(0xfffaea, 1.4);
        rimLight.position.set(1200, 3800, -4800);
        scene.add(rimLight);

        // 5. Gentle upward bounce light from studio floor
        const bounceLight = new THREE.DirectionalLight(0xf0f4f8, 0.5);
        bounceLight.position.set(1130, -2000, 1500);
        scene.add(bounceLight);

        // Studio Camera with natural telephoto perspective (FOV 34 deg for minimal distortion)
        const camera = new THREE.PerspectiveCamera(34, w / h, 10, 100000);
        camera.position.set(2900, 2400, 5800);
        camera.lookAt(DEFAULT_CENTER);
        cameraRef.current = camera;
        window.__threeCamera = cameraRef;

        // OrbitControls with buttery smooth damping
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = true;
        controls.panSpeed = 1.0;
        controls.minDistance = 800;
        controls.maxDistance = 16000;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.target.copy(DEFAULT_CENTER);
        controls.autoRotate = false;
        controls.autoRotateSpeed = 1.2;
        controlsRef.current = controls;
        window.__threeControls = controlsRef;

        // Realistic Showroom Stage / Ground Plane
        // 1. Dynamic shadow receiver floor
        const shadowFloorGeo = new THREE.PlaneGeometry(16000, 16000);
        const shadowFloorMat = new THREE.ShadowMaterial({
            opacity: 0.18,
            depthWrite: false
        });
        const shadowFloor = new THREE.Mesh(shadowFloorGeo, shadowFloorMat);
        shadowFloor.rotation.x = -Math.PI / 2;
        shadowFloor.position.y = 1;
        shadowFloor.receiveShadow = true;
        shadowFloor.isStageElement = true;
        scene.add(shadowFloor);

        // 2. High-end showroom contact AO shadow disc under equipment base & lifter
        const contactCanvas = document.createElement('canvas');
        contactCanvas.width = 1024;
        contactCanvas.height = 1024;
        const cctx = contactCanvas.getContext('2d');
        const cgrad = cctx.createRadialGradient(512, 512, 40, 512, 512, 500);
        cgrad.addColorStop(0, 'rgba(0, 0, 0, 0.16)');
        cgrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.09)');
        cgrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.03)');
        cgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        cctx.fillStyle = cgrad;
        cctx.fillRect(0, 0, 1024, 1024);

        const contactTex = new THREE.CanvasTexture(contactCanvas);
        const contactGeo = new THREE.PlaneGeometry(8000, 6400);
        const contactMat = new THREE.MeshBasicMaterial({
            map: contactTex,
            transparent: true,
            depthWrite: false
        });
        const contactMesh = new THREE.Mesh(contactGeo, contactMat);
        contactMesh.rotation.x = -Math.PI / 2;
        contactMesh.position.set(1130, 0.6, 0);
        contactMesh.isStageElement = true;
        scene.add(contactMesh);

        // Load textures
        const texLoader = new THREE.TextureLoader();
        const tubeTex = texLoader.load('/models/logo_tube.jpg');
        tubeTex.colorSpace = THREE.SRGBColorSpace;
        texturesRef.current = { tubeTex };

        // Two-finger touch panning for mobile
        let isPanning = false;
        let lastTouchPos = null;

        const onTouchStart = (e) => {
            if (e.touches.length === 2) {
                isPanning = true;
                lastTouchPos = {
                    x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                    y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                };
            }
        };

        const onTouchMove = (e) => {
            if (isPanning && e.touches.length === 2 && lastTouchPos) {
                const currentTouchPos = {
                    x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                    y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                };
                const deltaX = currentTouchPos.x - lastTouchPos.x;
                const deltaY = currentTouchPos.y - lastTouchPos.y;
                camera.position.x -= deltaX * 0.01;
                camera.position.y += deltaY * 0.01;
                lastTouchPos = currentTouchPos;
            }
        };

        const onTouchEnd = () => {
            isPanning = false;
            lastTouchPos = null;
        };

        const domElem = renderer.domElement;
        domElem.addEventListener('touchstart', onTouchStart, { passive: true });
        domElem.addEventListener('touchmove', onTouchMove, { passive: true });
        domElem.addEventListener('touchend', onTouchEnd, { passive: true });

        // Animation loop
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

            renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
            if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
            const newW = containerRef.current.clientWidth || window.innerWidth;
            const newH = containerRef.current.clientHeight || window.innerHeight;
            cameraRef.current.aspect = newW / newH;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(newW, newH);
        };
        window.addEventListener('resize', onResize);

        // Preload all FBX models with Realistic Physical PBR Materials
        const loader = new FBXLoader();
        const totalItems = ALL_PRELOAD_ITEMS.length;
        let loadedCount = 0;

        setIs3DLoading(true);
        setLoadingProgress(0);

        // Realistic PBR Materials matching DeWalt ToughSystem quality
        const steelMat = new THREE.MeshPhysicalMaterial({
            color: 0xdde2e8,
            roughness: 0.32,
            metalness: 0.3,
            clearcoat: 0.4,
            clearcoatRoughness: 0.16,
            reflectivity: 0.75
        });

        const yellowMat = new THREE.MeshPhysicalMaterial({
            color: 0xf5b400,
            roughness: 0.24,
            metalness: 0.08,
            clearcoat: 0.6,
            clearcoatRoughness: 0.12,
            reflectivity: 0.7
        });

        const darkSteelMat = new THREE.MeshPhysicalMaterial({
            color: 0x20242a,
            roughness: 0.52,
            metalness: 0.72,
            clearcoat: 0.2
        });

        const chromeMat = new THREE.MeshPhysicalMaterial({
            color: 0xd8dee6,
            roughness: 0.16,
            metalness: 0.94,
            clearcoat: 0.8
        });

        const tubeMat = new THREE.MeshPhysicalMaterial({
            map: tubeTex,
            roughness: 0.26,
            metalness: 0.04,
            clearcoat: 0.5,
            clearcoatRoughness: 0.12,
            reflectivity: 0.82
        });

        const rubberMat = new THREE.MeshStandardMaterial({
            color: 0x181a1c,
            roughness: 0.88,
            metalness: 0.02
        });

        const edgeLineMat = new THREE.LineBasicMaterial({
            color: 0x1e2228,
            transparent: true,
            opacity: 0.35
        });

        const preloadPromises = ALL_PRELOAD_ITEMS.map((item) => {
            const fileName = `/models/aardwolf_all_part_${item.name}.fbx`;
            return new Promise((resolve) => {
                loader.load(
                    fileName,
                    (fbx) => {
                        fbx.name = item.name;
                        const isTube = item.name.toLowerCase().includes('tube lift');
                        const isPump = item.name.toLowerCase().includes('pump');
                        const isCrane = item.name.toLowerCase().includes('crane') || item.name.toLowerCase().includes('arm');
                        const isHead = item.name.toLowerCase().includes('head') || item.name.toLowerCase().includes('suction');

                        fbx.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                const mname = child.name.toLowerCase();

                                if (isTube) {
                                    if (mname.includes('line') || mname.includes('tube') || mname.includes('bellow')) {
                                        child.material = tubeMat;
                                    } else {
                                        child.material = darkSteelMat;
                                    }
                                } else if (isPump) {
                                    if (mname.includes('shape') || mname.includes('box') || mname.includes('161')) {
                                        child.material = yellowMat;
                                    } else if (mname.includes('347') || mname.includes('116')) {
                                        child.material = chromeMat;
                                    } else {
                                        child.material = darkSteelMat;
                                    }
                                } else if (isCrane) {
                                    if (mname.includes('pin') || mname.includes('shaft')) {
                                        child.material = chromeMat;
                                    } else {
                                        child.material = steelMat;
                                    }
                                } else if (isHead) {
                                    if (mname.includes('pad') || mname.includes('cup') || mname.includes('rubber') || mname.includes('foam') || mname.includes('025')) {
                                        child.material = rubberMat;
                                    } else {
                                        child.material = darkSteelMat;
                                    }
                                }

                                // Apply subtle CAD precision edge lines to structural members
                                if (child.geometry && !child.userData.hasEdges && (isCrane || isPump || isHead)) {
                                    child.userData.hasEdges = true;
                                    try {
                                        const edges = new THREE.EdgesGeometry(child.geometry, 26);
                                        const line = new THREE.LineSegments(edges, edgeLineMat);
                                        child.add(line);
                                    } catch (e) {}
                                }
                            }
                        });

                        loadedObjectsMapRef.current.set(item.name, fbx);
                        loadedCount++;
                        setLoadingProgress(Math.round((loadedCount / totalItems) * 100));
                        resolve({ name: item.name, success: true });
                    },
                    undefined,
                    () => {
                        loadedCount++;
                        setLoadingProgress(Math.round((loadedCount / totalItems) * 100));
                        resolve({ name: item.name, success: false });
                    }
                );
            });
        });

        Promise.allSettled(preloadPromises).then(() => {
            isReadyRef.current = true;
            setIs3DLoading(false);
            setLoadingProgress(100);
            update3DScene();
        });

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onResize);
            domElem.removeEventListener('touchstart', onTouchStart);
            domElem.removeEventListener('touchmove', onTouchMove);
            domElem.removeEventListener('touchend', onTouchEnd);
            renderer.dispose();
            pmremGenerator.dispose();
        };
    }, []);

    const addToScene = useCallback((scene, modelName, pos) => {
        const obj = loadedObjectsMapRef.current.get(modelName);
        if (obj) {
            obj.position.set(pos.x, pos.z, pos.y);
            scene.add(obj);
        }
    }, []);

    // Update 3D Scene models & create scaled real-world workpiece
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
        if (!crane) return;

        const craneName = crane.name;
        const [p1, p2] = extractPoint3(craneName);
        let tubeHeight = TUBE_HEIGHT;

        // 1. Add Crane
        addToScene(scene, craneName, { x: 0, y: 0, z: 0 });

        // 2. Add Pump & Tube
        if (tube && pumpGroup) {
            let pump_z = p1.z;
            if (craneName.toLowerCase().includes("mobile")) {
                pump_z += 310;
            }

            addToScene(scene, pumpGroup.name, { x: p1.x, y: 0, z: pump_z });

            if (crane.name.toLowerCase().includes('articulated')) {
                tubeHeight -= 300;
            }

            addToScene(scene, tube.name, { x: p2.x, y: p2.y, z: p2.z });

            // 3. Add Head stack & Suction pack
            if (headStack && suctionPack) {
                const pad = {
                    x: p2.x - TUBE_OFFSET,
                    y: p2.y,
                    z: p2.z - tubeHeight - headStack.y
                };

                addToScene(scene, headStack.name, pad);
                addToScene(scene, suctionPack.name, pad);

                // 4. Create Real-world Workpiece 3D Mesh
                const workpieceGroup = new THREE.Group();
                workpieceGroupRef.current = workpieceGroup;

                const l = Math.max(50, actualLoad.length);
                const w = Math.max(50, actualLoad.width);
                const h = Math.max(20, actualLoad.height);

                const boxGeo = new THREE.BoxGeometry(l, h, w);
                let boxMatColor = 0xc2a67e;
                let boxMetalness = 0.05;
                let boxRoughness = 0.72;

                if (surfaceType === 'sheet_metal') {
                    boxMatColor = 0x9fb1c1;
                    boxMetalness = 0.8;
                    boxRoughness = 0.25;
                } else if (surfaceType === 'bag_woven') {
                    boxMatColor = 0xded8c6;
                    boxMetalness = 0.02;
                    boxRoughness = 0.85;
                }

                const boxMat = new THREE.MeshPhysicalMaterial({
                    color: boxMatColor,
                    roughness: boxRoughness,
                    metalness: boxMetalness,
                    clearcoat: surfaceType === 'sheet_metal' ? 0.6 : 0.0
                });
                const workpieceMesh = new THREE.Mesh(boxGeo, boxMat);
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

                // Dynamic bounding box centering
                const bbox = new THREE.Box3();
                scene.traverse((child) => {
                    if (child.isMesh && !child.isStageElement && !child.isSprite) {
                        bbox.expandByObject(child);
                    }
                });
                if (!bbox.isEmpty()) {
                    const center = new THREE.Vector3();
                    bbox.getCenter(center);
                    const size = new THREE.Vector3();
                    bbox.getSize(size);

                    currentCenterRef.current.copy(center);
                    currentSizeRef.current.copy(size);

                    const span = Math.max(size.x, size.y, 3000);
                    const targetCamPos = new THREE.Vector3(
                        center.x + (span * 0.45),
                        center.y + (span * 0.38),
                        Math.max(6000, span * 1.65)
                    );

                    if (cameraRef.current && controlsRef.current) {
                        cameraAnimRef.current = {
                            active: true,
                            startPos: cameraRef.current.position.clone(),
                            endPos: targetCamPos,
                            startTarget: controlsRef.current.target.clone(),
                            endTarget: center.clone(),
                            startTime: null,
                            duration: 0.75
                        };
                    }
                    if (lightTargetRef.current) {
                        lightTargetRef.current.position.set(center.x, 0, 0);
                    }
                }

                // PDF content coordinate sync
                const mv_x = 0;
                setPdfContent([
                    { path: crane.name, x: 0 + mv_x, y: 0 },
                    { path: pumpGroup.name, x: mv_x + p1.x, y: -pump_z },
                    { path: tube.name, x: mv_x + p2.x, y: -p2.z },
                    { path: headStack.name, x: mv_x + pad.x, y: -pad.z },
                    { path: suctionPack.name, x: mv_x + pad.x, y: -pad.z }
                ]);
            }
        }
    }, [config3D, actualLoad, unit, surfaceType, addToScene, setPdfContent]);

    useEffect(() => {
        if (isReadyRef.current) {
            update3DScene();
        }
    }, [config3D, actualLoad, update3DScene]);

    // Handle Camera Presets trigger
    useEffect(() => {
        if (!cameraPresetTrigger || !cameraRef.current || !controlsRef.current) return;

        if (cameraPresetTrigger === '360') {
            controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
        }

        const center = currentCenterRef.current;
        const size = currentSizeRef.current;
        const span = Math.max(size.x, size.y, 3000);

        const presets = {
            'bottom-view': { pos: new THREE.Vector3(center.x, -span * 1.5, 0), target: center },
            'front-view': { pos: new THREE.Vector3(center.x, center.y, Math.max(6400, span * 1.75)), target: center },
            'left-view': { pos: new THREE.Vector3(center.x + Math.max(6400, span * 1.75), center.y, 0), target: center },
            'right-view': { pos: new THREE.Vector3(center.x - Math.max(6400, span * 1.75), center.y, 0), target: center },
            'top-view': { pos: new THREE.Vector3(center.x, Math.max(7200, span * 1.95), 0), target: center },
            'ortho-view': { pos: new THREE.Vector3(center.x + (span * 0.45), center.y + (span * 0.38), Math.max(6000, span * 1.65)), target: center },
            '360': { pos: new THREE.Vector3(center.x + (span * 0.45), center.y + (span * 0.38), Math.max(6000, span * 1.65)), target: center }
        };

        const targetConfig = presets[cameraPresetTrigger];
        if (targetConfig) {
            cameraAnimRef.current = {
                active: true,
                startPos: cameraRef.current.position.clone(),
                endPos: targetConfig.pos,
                startTarget: controlsRef.current.target.clone(),
                endTarget: targetConfig.target,
                startTime: null,
                duration: 0.9
            };
        }

        setCameraPresetTrigger(null);
    }, [cameraPresetTrigger, setCameraPresetTrigger]);

    // Re-frame camera and update aspect ratio on fullscreen modal toggle
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!containerRef.current || !rendererRef.current || !cameraRef.current || !controlsRef.current) return;
            const newW = containerRef.current.clientWidth || window.innerWidth;
            const newH = containerRef.current.clientHeight || window.innerHeight;
            cameraRef.current.aspect = newW / newH;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(newW, newH);

            const center = currentCenterRef.current;
            const size = currentSizeRef.current;
            const span = Math.max(size.x, size.y, 3000);

            const targetPos = show3DModal
                ? new THREE.Vector3(center.x + (span * 0.42), center.y + (span * 0.32), Math.max(5400, span * 1.45))
                : new THREE.Vector3(center.x + (span * 0.45), center.y + (span * 0.38), Math.max(6000, span * 1.65));

            cameraAnimRef.current = {
                active: true,
                startPos: cameraRef.current.position.clone(),
                endPos: targetPos,
                startTarget: controlsRef.current.target.clone(),
                endTarget: center.clone(),
                startTime: null,
                duration: 0.7
            };
        }, 150);

        return () => clearTimeout(timer);
    }, [show3DModal]);

    return (
        <div className="three-viewport-wrapper">
            {/* Live Interactive Three.js WebGL Container */}
            <div
                id="threejs-container"
                ref={containerRef}
            />

            {/* Subtle Viewport Badge */}
            <div className="viewport-status-badge">
                <span className="live-dot" />
                <span>3D Live View</span>
            </div>
        </div>
    );
}
