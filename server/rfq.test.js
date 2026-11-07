import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRfq, listRfqs } from './rfq.js';
test('RFQ validates contact and preserves a configuration snapshot', async () => {
 const directory=await mkdtemp(path.join(os.tmpdir(),'aardwolf-rfq-'));process.env.SETTINGS_DIR=directory;
 try {
  await assert.rejects(createRfq({name:'A',email:'invalid',configuration:{}}),/email/);
  const config={workLoadLimit:'55kg',actualLoad:{weight:35},models:[{file:'/models/test.fbx'}]};
  const receipt=await createRfq({name:'Test',email:'test@example.com',configuration:config,consultation:true});
  const records=await listRfqs();assert.equal(records.length,1);assert.equal(records[0].id,receipt.id);assert.deepEqual(records[0].configuration,config);assert.equal(records[0].consultation,true);
 }finally {delete process.env.SETTINGS_DIR;await rm(directory,{recursive:true,force:true});}
});
