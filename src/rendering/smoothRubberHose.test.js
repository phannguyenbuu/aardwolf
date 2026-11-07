import test from 'node:test';
import assert from 'node:assert/strict';
import { CylinderGeometry } from 'three';
import { smoothRubberHose } from './smoothRubberHose.js';

test('hose subdivision preserves source geometry and produces finite normals and UVs', () => {
    const source = new CylinderGeometry(10,10,200,8,4,true);
    const before=Array.from(source.attributes.position.array);
    const output=smoothRubberHose(source,2);
    assert.deepEqual(Array.from(source.attributes.position.array),before);
    assert.ok(output.attributes.position.count>source.attributes.position.count);
    for(const name of ['position','normal','uv'])assert.ok(Array.from(output.attributes[name].array).every(Number.isFinite));
    assert.equal(output.attributes.normal.count,output.attributes.position.count);
    assert.equal(output.groups.reduce((n,g)=>n+g.count,0),output.attributes.position.count);
    output.dispose();source.dispose();
});
