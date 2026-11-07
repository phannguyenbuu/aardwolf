import * as THREE from "three";
import { DEFAULT_CENTER } from './constants.js';

export default function createCornellEnvironment({ refs, scene, lightTarget }) {
    const {
        cornellGroupRef,
        cornellLeftWallMatRef,
        cornellRightWallMatRef,
        cornellBackWallMatRef,
        cornellFloorMatRef,
        cornellCeilingMatRef,
        cornellEmitterMatRef,
        cornellCeilingLightRef,
        cornellGreenBounceRef,
        cornellRedBounceRef,
    } = refs;
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
}
