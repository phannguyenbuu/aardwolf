import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
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

// Equipment center for camera targeting
const EQUIPMENT_CENTER = new THREE.Vector3(1130, 1150, 0);

function createDimensionSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
    ctx.roundRect(0, 0, 256, 64, 12);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Open Sans, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(400, 100, 1);
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

    const [viewMode, setViewMode] = useState('3d'); // '3d' or 'photo'
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const loadedObjectsMapRef = useRef(new Map());
    const isReadyRef = useRef(false);
    const workpieceGroupRef = useRef(null);
    const texturesRef = useRef({});

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

        // Realistic studio lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        // Key light
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
        keyLight.position.set(2500, 3500, 3000);
        scene.add(keyLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xd0e0ff, 0.7);
        fillLight.position.set(-2500, 2000, -2000);
        scene.add(fillLight);

        // Rim / Back light
        const rimLight = new THREE.DirectionalLight(0xfffaed, 0.6);
        rimLight.position.set(1000, 3000, -3500);
        scene.add(rimLight);

        // Camera with natural studio lens (FOV 40)
        const camera = new THREE.PerspectiveCamera(40, w / h, 10, 100000);
        camera.position.set(2400, 1700, 4400);
        cameraRef.current = camera;
        window.__threeCamera = cameraRef;

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
        renderer.setClearColor(0xd1d2d3, 1);
        rendererRef.current = renderer;

        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = true;
        controls.panSpeed = 1.0;
        controls.minDistance = 500;
        controls.maxDistance = 15000;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.copy(EQUIPMENT_CENTER);
        controlsRef.current = controls;
        window.__threeControls = controlsRef;

        // Ground contact shadow
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = 512;
        shadowCanvas.height = 512;
        const sctx = shadowCanvas.getContext('2d');
        const grad = sctx.createRadialGradient(256, 256, 40, 256, 256, 250);
        grad.addColorStop(0, 'rgba(30, 30, 30, 0.45)');
        grad.addColorStop(0.5, 'rgba(60, 60, 60, 0.18)');
        grad.addColorStop(1, 'rgba(209, 210, 211, 0)');
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 512, 512);

        const shadowTex = new THREE.CanvasTexture(shadowCanvas);
        const shadowGeo = new THREE.PlaneGeometry(3800, 3800);
        const shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTex,
            transparent: true,
            depthWrite: false
        });
        const groundShadow = new THREE.Mesh(shadowGeo, shadowMat);
        groundShadow.rotation.x = -Math.PI / 2;
        groundShadow.position.set(1130, 2, 0);
        groundShadow.isGroundShadow = true;
        scene.add(groundShadow);

        // Load textures
        const texLoader = new THREE.TextureLoader();
        const tubeTex = texLoader.load('/models/logo_tube.jpg');
        tubeTex.colorSpace = THREE.SRGBColorSpace;
        const craneTex = texLoader.load('/models/logo_crane.jpg');
        craneTex.colorSpace = THREE.SRGBColorSpace;
        texturesRef.current = { tubeTex, craneTex };

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
                const ease = 0.5 - Math.cos(progress * Math.PI) / 2; // easeInOutSine

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

        // Preload all FBX models
        const loader = new FBXLoader();
        const totalItems = ALL_PRELOAD_ITEMS.length;
        let loadedCount = 0;

        setIs3DLoading(true);
        setLoadingProgress(0);

        const steelMat = new THREE.MeshStandardMaterial({
            color: 0xdedfe2,
            roughness: 0.4,
            metalness: 0.3
        });
        const yellowMat = new THREE.MeshStandardMaterial({
            color: 0xf5b400,
            roughness: 0.35,
            metalness: 0.1
        });
        const darkSteelMat = new THREE.MeshStandardMaterial({
            color: 0x33373d,
            roughness: 0.5,
            metalness: 0.4
        });
        const tubeMat = new THREE.MeshStandardMaterial({
            map: tubeTex,
            roughness: 0.3,
            metalness: 0.05
        });
        const edgeLineMat = new THREE.LineBasicMaterial({
            color: 0x222222,
            transparent: true,
            opacity: 0.45
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

                        fbx.traverse((child) => {
                            if (child.isMesh) {
                                const mname = child.name.toLowerCase();

                                // Apply custom high-quality materials matching DeWalt & CAD renders
                                if (isTube) {
                                    child.material = tubeMat;
                                } else if (isPump) {
                                    if (mname.includes('shape') || mname.includes('box') || mname.includes('161')) {
                                        child.material = yellowMat;
                                    } else {
                                        child.material = darkSteelMat;
                                    }
                                } else if (isCrane) {
                                    child.material = steelMat;
                                }

                                // Apply CAD technical illustration edge outlines
                                if (child.geometry && !child.userData.hasEdges && (isCrane || isPump)) {
                                    child.userData.hasEdges = true;
                                    try {
                                        const edges = new THREE.EdgesGeometry(child.geometry, 28);
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

        // Clear existing models except lights and ground shadow
        for (let i = scene.children.length - 1; i >= 0; i--) {
            const child = scene.children[i];
            if (!child.isLight && !child.isAxesHelper && !child.isGroundShadow) {
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

                // 4. Create Real-world Workpiece 3D Mesh (scaled according to actualLoad)
                const workpieceGroup = new THREE.Group();
                workpieceGroupRef.current = workpieceGroup;

                const l = Math.max(50, actualLoad.length);
                const w = Math.max(50, actualLoad.width);
                const h = Math.max(20, actualLoad.height);

                const boxGeo = new THREE.BoxGeometry(l, h, w);
                let boxMatColor = 0xc2a67e;
                if (surfaceType === 'sheet_metal') boxMatColor = 0x8899aa;
                if (surfaceType === 'bag_woven') boxMatColor = 0xd5ceb8;

                const boxMat = new THREE.MeshStandardMaterial({
                    color: boxMatColor,
                    roughness: 0.7,
                    metalness: surfaceType === 'sheet_metal' ? 0.6 : 0.1
                });
                const workpieceMesh = new THREE.Mesh(boxGeo, boxMat);

                const workpieceCenterY = pad.z - (h / 2);
                workpieceMesh.position.set(pad.x, workpieceCenterY, pad.y);
                workpieceGroup.add(workpieceMesh);

                const edgesGeo = new THREE.EdgesGeometry(boxGeo);
                const edgesMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
                const wireframe = new THREE.LineSegments(edgesGeo, edgesMat);
                wireframe.position.copy(workpieceMesh.position);
                workpieceGroup.add(wireframe);

                const dimText = unit === 'Inch'
                    ? `${Math.round(mmToInch(l))}" × ${Math.round(mmToInch(w))}"`
                    : `${l} × ${w} mm`;
                const sprite = createDimensionSprite(dimText);
                sprite.position.set(pad.x, workpieceCenterY - (h / 2) - 80, pad.y);
                workpieceGroup.add(sprite);

                scene.add(workpieceGroup);

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

        const presets = {
            'bottom-view': { pos: new THREE.Vector3(1130, -3500, 0), target: EQUIPMENT_CENTER },
            'front-view': { pos: new THREE.Vector3(1130, 1150, 4800), target: EQUIPMENT_CENTER },
            'left-view': { pos: new THREE.Vector3(5600, 1150, 0), target: EQUIPMENT_CENTER },
            'right-view': { pos: new THREE.Vector3(-3400, 1150, 0), target: EQUIPMENT_CENTER },
            'top-view': { pos: new THREE.Vector3(1130, 5600, 0), target: EQUIPMENT_CENTER },
            'ortho-view': { pos: new THREE.Vector3(3600, 3200, 3600), target: EQUIPMENT_CENTER },
            '360': { pos: new THREE.Vector3(2400, 1700, 4400), target: EQUIPMENT_CENTER }
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
                duration: 0.8
            };
        }

        setCameraPresetTrigger(null);
    }, [cameraPresetTrigger, setCameraPresetTrigger]);

    return (
        <div className="three-viewport-wrapper">
            {/* View Mode Switcher Header Pill */}
            <div className="viewport-mode-switcher">
                <button
                    className={`mode-btn ${viewMode === '3d' ? 'active' : ''}`}
                    onClick={() => setViewMode('3d')}
                    title="Interactive 3D Viewport with Orbit / Zoom"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                    3D Interactive
                </button>
                <button
                    className={`mode-btn ${viewMode === 'photo' ? 'active' : ''}`}
                    onClick={() => setViewMode('photo')}
                    title="High-definition Studio Render"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    Studio Render
                </button>
            </div>

            {/* Static High-definition Studio Render view */}
            {viewMode === 'photo' && (
                <div className="photo-render-view">
                    <img
                        src="/assets/images/image-1.png"
                        alt="Aardwolf Vacuum Tube Lifter 3D Render"
                        className="photo-render-img"
                    />
                    <div className="photo-render-caption">
                        <span>Aardwolf Lifter • High Precision 3D Render</span>
                    </div>
                </div>
            )}

            {/* Interactive Three.js WebGL Container */}
            <div
                id="threejs-container"
                ref={containerRef}
                style={{ display: viewMode === '3d' ? 'flex' : 'none' }}
            />
        </div>
    );
}
