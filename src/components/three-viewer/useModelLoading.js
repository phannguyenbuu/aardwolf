import { useEffect } from "react";
import { ALL_PRELOAD_ITEMS } from "../../constants/data.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import * as THREE from "three";

export default function useModelLoading({
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
}) {
    const { isReadyRef, modelLoadingRef, sceneFileRevisionRef, loadedObjectsMapRef, modelRequestsRef, prefetchedFilesRef, reloadTargetRef, pathTraceOpenRef } = refs;
    const requiredModels = config3D.data3D.filter(Boolean);
    const requiredModelKey = JSON.stringify(requiredModels.map(item => item.name));
    useEffect(() => {
        if (!viewportGeneration || !isReadyRef.current) return;
        let cancelled = false, startupFrame, startupTimer;
        let completed = 0;
        setFrameReady(false);
        if (refs.sceneRef.current) {
            refs.sceneRef.current.userData.assemblyReady = false;
            refs.sceneRef.current.userData.framePresented = false;
            refs.sceneRef.current.userData.presentationRevision = (refs.sceneRef.current.userData.presentationRevision || 0) + 1;
        }
        setModelLoadError('');
        setBackgroundModelProgress(null);
        modelLoadingRef.current = true;
        setIs3DLoading(true);
        setLoadingProgress(0);
        const modelUrl = item => {
            const catalogItem = ALL_PRELOAD_ITEMS.find(asset => asset.name === item.name);
            const file = item.file || catalogItem?.file || `/models/aardwolf_all_part_${item.name}.fbx`;
            const revision = sceneFileRevisionRef.current;
            return revision ? `${file}${file.includes('?') ? '&' : '?'}sceneReload=${revision}` : file;
        };
        const load = item => {
            if (loadedObjectsMapRef.current.has(item.name)) return Promise.resolve();
            if (modelRequestsRef.current.has(item.name)) return modelRequestsRef.current.get(item.name);
            const promise = new Promise((resolve, reject) => {
                const revision = sceneFileRevisionRef.current;
                const url = modelUrl(item);
                const finish = object => {
                    if (revision !== sceneFileRevisionRef.current) { resolve(); return; }
                    object.name = item.name;
                    object.traverse(child => {
                        if (child.isMesh) {
                            child.castShadow = true; child.receiveShadow = true;
                            child.userData.origGeometry = child.geometry;
                        }
                    });
                    loadedObjectsMapRef.current.set(item.name, object);
                    prefetchedFilesRef.current.delete(item.name);
                    resolve();
                };
                const prefetched = prefetchedFilesRef.current.get(item.name);
                if (prefetched?.url === url) {
                    try { finish(new FBXLoader().parse(prefetched.buffer, THREE.LoaderUtils.extractUrlBase(url))); }
                    catch { reject(new Error(`Could not load ${item.name}.fbx`)); }
                    return;
                }
                new FBXLoader().load(url, finish, undefined, () => reject(new Error(`Could not load ${item.name}.fbx`)));
            }).finally(() => { if (modelRequestsRef.current.get(item.name) === promise) modelRequestsRef.current.delete(item.name); });
            modelRequestsRef.current.set(item.name, promise);
            return promise;
        };
        const start = async () => {
            try {
                // Limit downloads/parsing to two selected assets at a time.
                const queue = reloadTargetRef.current ? requiredModels.filter(item => item.name === reloadTargetRef.current) : [...requiredModels];
                const worker = async () => {
                    while (!cancelled && queue.length) {
                        const item = queue.shift();
                        await load(item);
                        if (cancelled) return;
                        completed++;
                        setLoadingProgress(Math.round(completed / requiredModels.length * 100));
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                };
                await Promise.all([worker(), worker()]);
                if (!cancelled) { setModelRevision(value => value + 1); }
            } catch (error) {
                if (!cancelled) setModelLoadError(error.message);
            } finally {
                if (!cancelled) { modelLoadingRef.current = false; setIs3DLoading(false); }
            }

        };
        startupFrame = requestAnimationFrame(() => {
            startupFrame = requestAnimationFrame(() => { startupTimer = setTimeout(start, 0); });
        });
        return () => { cancelled = true; cancelAnimationFrame(startupFrame); clearTimeout(startupTimer); };
    }, [viewportGeneration, requiredModelKey, modelRetry]);
}
