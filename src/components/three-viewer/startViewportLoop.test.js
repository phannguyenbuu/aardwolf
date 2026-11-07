import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import startViewportLoop from './startViewportLoop.js';

function setup(t) {
    const frames = new Map();
    let nextId = 0;
    t.mock.method(globalThis, 'requestAnimationFrame', callback => {
        frames.set(++nextId, callback);
        return nextId;
    });
    t.mock.method(globalThis, 'cancelAnimationFrame', id => frames.delete(id));
    const ref = current => ({ current });
    const refs = {
        cameraAnimRef: ref({ active: false }),
        isReadyRef: ref(true),
        hasFramedCameraRef: ref(false),
        pathTraceOpenRef: ref(false),
        lowQualityRef: ref(false),
        legacyPreviewRef: ref({ render: t.mock.fn() }),
        renderModeRef: ref('studio-render'),
        hdrSSRRef: ref(null),
        qualityRef: ref({}),
        statusTimeRef: ref(performance.now()),
        studioRendererRef: ref(null),
        exportAbortRef: ref(null),
    };
    const camera = new PerspectiveCamera(34);
    camera.position.set(0, 0, 6000);
    const controls = { target: new Vector3(), update: t.mock.fn() };
    const composer = { render: t.mock.fn() };
    const trackCamera = t.mock.fn();
    const setCameraTelemetry = t.mock.fn();
    let contextLost = false;
    const renderer = { getContext: () => ({ isContextLost: () => contextLost }) };
    const stop = startViewportLoop({
        refs, camera, controls, renderer, composer,
        scene: {}, trackCamera, setCameraTelemetry, setRenderStatus: t.mock.fn(),
    });
    t.after(stop);
    const step = timestamp => {
        const [id, callback] = frames.entries().next().value;
        frames.delete(id);
        callback(timestamp);
    };
    return {
        refs, camera, controls, composer, frames, trackCamera, setCameraTelemetry,
        stop, step, loseContext: () => { contextLost = true; },
    };
}

// Node does not define the browser scheduler. Install configurable placeholders
// so each test can mock and restore it without changing the loop implementation.
globalThis.requestAnimationFrame ??= () => {};
globalThis.cancelAnimationFrame ??= () => {};

test('pauses viewport rendering while a dialog owns the GPU and resumes after close', t => {
    const state = setup(t);
    assert.equal(state.composer.render.mock.callCount(), 1);
    state.refs.pathTraceOpenRef.current = true;
    state.step(200);
    assert.equal(state.composer.render.mock.callCount(), 1);
    state.refs.pathTraceOpenRef.current = false;
    state.step(400);
    assert.equal(state.composer.render.mock.callCount(), 2);
});

test('low quality uses the legacy preview and a lost context skips rendering', t => {
    const state = setup(t);
    state.refs.lowQualityRef.current = true;
    state.step(200);
    assert.equal(state.refs.legacyPreviewRef.current.render.mock.callCount(), 1);
    assert.equal(state.composer.render.mock.callCount(), 1);
    state.loseContext();
    state.step(400);
    assert.equal(state.refs.legacyPreviewRef.current.render.mock.callCount(), 1);
});

test('tracks the saved camera only after framing and completes camera transitions', t => {
    const state = setup(t);
    state.step(200);
    assert.equal(state.trackCamera.mock.callCount(), 0);
    state.refs.hasFramedCameraRef.current = true;
    state.refs.cameraAnimRef.current = {
        active: true, startTime: 200, duration: 0.8,
        startPos: state.camera.position.clone(), endPos: new Vector3(3000, 2000, 0),
        startTarget: state.controls.target.clone(), endTarget: new Vector3(10, 20, 30),
    };
    state.step(1000);
    assert.deepEqual(state.camera.position.toArray(), [3000, 2000, 0]);
    assert.deepEqual(state.controls.target.toArray(), [10, 20, 30]);
    assert.equal(state.refs.cameraAnimRef.current.active, false);
    assert.equal(state.trackCamera.mock.callCount(), 1);
    assert.equal(state.setCameraTelemetry.mock.callCount(), 2);
});

test('cleanup cancels the outstanding frame', t => {
    const state = setup(t);
    state.step(200);
    assert.equal(state.frames.size, 1);
    state.stop();
    assert.equal(state.frames.size, 0);
});

test('keeps the low preview while high quality resources are loading', t => {
    const state = setup(t);
    state.refs.composerRef = { current: null };
    state.step(200);
    assert.equal(state.refs.legacyPreviewRef.current.render.mock.callCount(), 1);
    state.refs.composerRef.current = state.composer;
    state.step(400);
    assert.equal(state.composer.render.mock.callCount(), 2);
});
