import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRenderPrompt } from './prompt.js';
import { renderSystemPrompt, renderScenes } from '../../../src/rendering/renderModalConfig.js';

test('a different product gets only its own instructions and scene', () => {
    const prompt = buildRenderPrompt({ systemPrompt: 'Keep the shoe logo.', prompt: 'Soft morning light.',
        scenePrompt: 'Product photo.', contextPrompt: 'Outdoor.', scene: { prompt: 'A beach.' }, aspectRatio: '1:1' });
    assert.match(prompt, /shoe logo/);
    assert.match(prompt, /A beach/);
    assert.match(prompt, /1:1/);
    assert.doesNotMatch(prompt, /aardwolf|machine|crane|tube|industrial|undefined/i);
});
test('default prompt adds no brand, product or scene policy', () => {
    assert.equal(buildRenderPrompt({ prompt: 'Watercolour flowers.' }), 'Watercolour flowers.');
});
test('product constraints and scenes are supplied by the existing host', () => {
    assert.match(renderSystemPrompt, /AARDWOLF/);
    assert.equal(renderScenes.length, 7);
    const prompt = buildRenderPrompt({ systemPrompt: renderSystemPrompt, scene: renderScenes[0],
        aspectRatio: '4:3', cameraMetadata: { fov: 45 } });
    assert.match(prompt, /AARDWOLF/);
    assert.match(prompt, /photography studio/);
    assert.match(prompt, /"fov":45/);
});
