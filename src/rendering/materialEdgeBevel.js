import * as THREE from 'three';

// Shader bevel: keeps the silhouette and FBX topology intact.
export function applyMaterialEdgeBevel(mesh, material) {
    const mats = Array.isArray(material) ? material : [material];
    if (!mats.some(m => m.userData.edgeChamferRadius > 0)) return;
    if (!mesh.geometry.attributes.bevelSmoothNormal) {
        const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        const p = g.attributes.position, n = g.attributes.normal;
        const sums = new Map(), keys = [];
        for (let i=0;i<p.count;i++) {
            const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(',');keys.push(key);
            if(!sums.has(key))sums.set(key,new THREE.Vector3());
            sums.get(key).add(new THREE.Vector3().fromBufferAttribute(n,i));
        }
        const normals=[], distances=[];
        mesh.updateWorldMatrix(true,false);
        for(let i=0;i<p.count;i+=3) {
            const v=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,i+j).applyMatrix4(mesh.matrixWorld));
            const area=new THREE.Vector3().crossVectors(v[1].clone().sub(v[0]),v[2].clone().sub(v[0])).length();
            const h=[area/Math.max(1e-8,v[1].distanceTo(v[2])),area/Math.max(1e-8,v[2].distanceTo(v[0])),area/Math.max(1e-8,v[0].distanceTo(v[1]))];
            for(let j=0;j<3;j++) { normals.push(...sums.get(keys[i+j]).clone().normalize().toArray());distances.push(j===0?h[0]:0,j===1?h[1]:0,j===2?h[2]:0); }
        }
        g.setAttribute('bevelSmoothNormal',new THREE.Float32BufferAttribute(normals,3));
        g.setAttribute('bevelEdgeDistance',new THREE.Float32BufferAttribute(distances,3));mesh.geometry=g;
    }
    for(const mat of mats) {
        const radius=mat.userData.edgeChamferRadius || 0;
        if(!radius)continue;
        mat.onBeforeCompile=shader=>{
            shader.uniforms.edgeChamferRadius={value:radius};
            shader.vertexShader='attribute vec3 bevelSmoothNormal; attribute vec3 bevelEdgeDistance; varying vec3 vBevelNormal; varying vec3 vBevelDistance;\n'+shader.vertexShader;
            shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBevelNormal = normalize(normalMatrix * bevelSmoothNormal); vBevelDistance = bevelEdgeDistance;');
            shader.fragmentShader='uniform float edgeChamferRadius; varying vec3 vBevelNormal; varying vec3 vBevelDistance;\n'+shader.fragmentShader;
            shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nfloat bevelDistance = min(vBevelDistance.x, min(vBevelDistance.y, vBevelDistance.z)); float bevelWeight = 1.0 - smoothstep(0.0, edgeChamferRadius, bevelDistance); normal = normalize(mix(normal, normalize(vBevelNormal) * faceDirection, bevelWeight));');
        };
        mat.customProgramCacheKey=()=>`edge-bevel-${radius}`;
    }
}
