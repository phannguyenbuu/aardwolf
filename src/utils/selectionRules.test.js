import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { selectionEligibility, clearFollowingSteps, effectiveLoadType, padSupportsMaterial } from './selectionRules.js';
const rules = JSON.parse(fs.readFileSync(new URL('../constants/rules.json',import.meta.url)));
const head = id => rules.suctionHeads.find(item => item.id === id);
const config = {surfaceType:'carton_smooth',environment:'nonporous',actualLoad:{weight:30,length:500,width:400},capacityKg:30};

test('30 kg WLL uses Excel maximum pad capacities, not a fabricated minimum', () => {
    assert.equal(selectionEligibility(head('bellow_cups_1x_200'),config).eligible,true);
    assert.equal(selectionEligibility(head('bellow_cups_4x_100'),config).eligible,true);
    assert.equal(selectionEligibility(head('bellow_cups_2x_125'),config).eligible,false);
    assert.equal(selectionEligibility(head('bellow_cups_1x_200'),{...config,environment:'porous'}).eligible,false);
});
test('WLL, pad capacity and contact size each constrain eligibility', () => {
    const pad = head('bellow_cups_4x_100');
    assert.equal(selectionEligibility(pad,{...config,actualLoad:{...config.actualLoad,weight:31}}).eligible,false);
    assert.equal(selectionEligibility(pad,{...config,actualLoad:{...config.actualLoad,width:100}}).eligible,false);
    assert.equal(selectionEligibility(pad,{...config,actualLoad:{weight:17,length:250,width:250},environment:'porous'}).eligible,true);
});
test('permeability is independent of material and old workplace labels', () => {
    assert.equal(effectiveLoadType('nonporous','porous_rough'),'nonporous');
    assert.equal(effectiveLoadType('porous','carton_smooth'),'porous');
    assert.equal(effectiveLoadType('dusty','sheet_metal'),'nonporous');
});
test('stone/concrete require the Excel flat tooling and unavailable models stay disabled', () => {
    assert.equal(padSupportsMaterial(head('bellow_cups_1x_200'),'stone'),false);
    assert.equal(padSupportsMaterial(head('flat_cup_25mm'),'stone'),true);
    assert.equal(selectionEligibility(head('flat_cup_25mm'),{...config,surfaceType:'stone'}).eligible,false);
});
test('changing WLL revokes downstream explicit answers, preserving crane and jib', () => {
    const original=new Set(['crane','jib','wll','environment','surface','handle','suction']);
    assert.deepEqual([...clearFollowingSteps(original,'wll')],['crane','jib','wll']);
    assert.equal(original.size,7);
    assert.deepEqual(rules.wllLevels.find(level=>level.id==='30kg').allowedHandles,['MHC','CF2']);
});
