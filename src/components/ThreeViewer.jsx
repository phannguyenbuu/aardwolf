import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';
import { ALL_PRELOAD_ITEMS } from '../constants/data.js';

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

export default function ThreeViewer() {
    const containerRef = useRef(null);
    const {
        config3D,
        setPdfContent,
        setIs3DLoading,
        setLoadingProgress,
        cameraPresetTrigger,
        setCameraPresetTrigger
    } = useConfigurator();

    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const loadedObjectsMapRef = useRef(new Map());
    const isReadyRef = useRef(false);

    // Camera animation refs
    const cameraAnimRef = useRef({
        active: false,
        startPos: new THREE.Vector3(),
        endPos: new THREE.Vector3(),
        startTime: null,
        duration: 1.0
    });

    // Initialize Three.js scene
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const axesHelper = new THREE.AxesHelper(5);
        axesHelper.isAxesHelper = true;
        scene.add(axesHelper);

        const ambientLight = new THREE.AmbientLight(0x808080);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xdadada, 1);
        directionalLight.position.set(232, 380, 336);
        scene.add(directionalLight);

        const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100000);
        camera.position.set(window.innerWidth <= 820 ? 800 : 2000, 1500, 8000);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setClearColor(window.innerWidth <= 820 ? 0xe6e6e6 : 0xd1d2d3);
        rendererRef.current = renderer;

        // Clear container and append canvas
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = true;
        controls.panSpeed = 1.0;
        controls.minDistance = 0;
        controls.maxDistance = 10000;
        controls.enableDamping = true;
        controls.target.set(window.innerWidth <= 820 ? 800 : 2000, 1500, 0);
        controlsRef.current = controls;

        // Two-finger panning on touch devices
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

            // Handle smooth camera movement
            const anim = cameraAnimRef.current;
            if (anim.active) {
                if (!anim.startTime) anim.startTime = timestamp;
                const elapsed = (timestamp - anim.startTime) / 1000;
                const progress = Math.min(elapsed / anim.duration, 1);

                camera.position.lerpVectors(anim.startPos, anim.endPos, progress);
                camera.lookAt(0, 0, 0);

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

        // Window resize handler
        const onResize = () => {
            if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
            const newW = containerRef.current.clientWidth || window.innerWidth;
            const newH = containerRef.current.clientHeight || window.innerHeight;
            cameraRef.current.aspect = newW / newH;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(newW, newH);
            rendererRef.current.setClearColor(window.innerWidth <= 820 ? 0xe6e6e6 : 0xd1d2d3);
        };
        window.addEventListener('resize', onResize);

        // Preload all FBX models
        const loader = new FBXLoader();
        const totalItems = ALL_PRELOAD_ITEMS.length;
        let loadedCount = 0;

        setIs3DLoading(true);
        setLoadingProgress(0);

        const preloadPromises = ALL_PRELOAD_ITEMS.map((item) => {
            const fileName = `/models/aardwolf_all_part_${item.name}.fbx`;
            return new Promise((resolve) => {
                loader.load(
                    fileName,
                    (fbx) => {
                        fbx.name = item.name;
                        fbx.traverse((child) => {
                            if (child.isMesh && child.material) {
                                if (child.name.includes('bounding')) {
                                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                                    mats.forEach((mat) => {
                                        mat.emissive = new THREE.Color(0x333333);
                                        mat.emissiveIntensity = 2.5;
                                    });
                                }
                            }
                        });
                        loadedObjectsMapRef.current.set(item.name, fbx);
                        loadedCount++;
                        setLoadingProgress(Math.round((loadedCount / totalItems) * 100));
                        resolve({ name: item.name, success: true });
                    },
                    undefined,
                    (error) => {
                        console.warn(`Failed to preload ${fileName}:`, error);
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

    // Function to add objects to scene at coordinates
    const addToScene = useCallback((scene, modelName, pos) => {
        const obj = loadedObjectsMapRef.current.get(modelName);
        if (obj) {
            obj.position.set(pos.x, pos.z, pos.y);
            scene.add(obj);
        } else {
            console.warn('Model not found in preloaded cache:', modelName);
        }
    }, []);

    // Update scene models whenever config3D changes
    const update3DScene = useCallback(() => {
        const scene = sceneRef.current;
        if (!scene || !isReadyRef.current) return;

        // Clear previous models (preserve lights and axes helper)
        for (let i = scene.children.length - 1; i >= 0; i--) {
            const child = scene.children[i];
            if (!child.isLight && !child.isAxesHelper) {
                scene.remove(child);
            }
        }

        const { crane, pumpGroup, tube, headStack, suctionPack } = config3D;
        if (!crane) return;

        const craneName = crane.name;
        const [p1, p2] = extractPoint3(craneName);
        let tubeHeight = TUBE_HEIGHT;

        // 1. Add Crane at (0, 0, 0)
        addToScene(scene, craneName, { x: 0, y: 0, z: 0 });

        // 2. Add Pump & Tube if available
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

            // 3. Add Head stack & Suction pack if available
            if (headStack && suctionPack) {
                const pad = {
                    x: p2.x - TUBE_OFFSET,
                    y: p2.y,
                    z: p2.z - tubeHeight - headStack.y
                };

                addToScene(scene, headStack.name, pad);
                addToScene(scene, suctionPack.name, pad);

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
    }, [config3D, addToScene, setPdfContent]);

    useEffect(() => {
        if (isReadyRef.current) {
            update3DScene();
        }
    }, [config3D, update3DScene]);

    // Handle Camera Presets trigger
    useEffect(() => {
        if (!cameraPresetTrigger || !cameraRef.current) return;

        const presets = {
            'bottom-view': new THREE.Vector3(0, -8000, 0),
            'front-view': new THREE.Vector3(0, 1500, 7000),
            'left-view': new THREE.Vector3(7000, 1500, 0),
            'right-view': new THREE.Vector3(-7000, 1500, 0),
            'top-view': new THREE.Vector3(0, 8000, 0),
            'ortho-view': new THREE.Vector3(5000, 5000, 5000),
            '360': new THREE.Vector3(-5000, 5000, -5000)
        };

        const targetPos = presets[cameraPresetTrigger];
        if (targetPos) {
            cameraAnimRef.current = {
                active: true,
                startPos: cameraRef.current.position.clone(),
                endPos: targetPos,
                startTime: null,
                duration: 1.0
            };
        }

        setCameraPresetTrigger(null);
    }, [cameraPresetTrigger, setCameraPresetTrigger]);

    return (
        <div id="threejs-container" ref={containerRef} />
    );
}
