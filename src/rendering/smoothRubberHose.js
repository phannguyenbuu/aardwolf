import * as THREE from 'three';

// Loop subdivision welds position seams while interpolating UVs per face.
export function smoothRubberHose(source, iterations = 2) {
    let geometry = source.index ? source.toNonIndexed() : source.clone();
    for (let pass = 0; pass < iterations; pass++) {
        const p = geometry.attributes.position, uv = geometry.attributes.uv;
        const points = [], ids = [], lookup = new Map(), edges = new Map(), neighbours = [];
        for (let i = 0; i < p.count; i++) {
            const v = new THREE.Vector3().fromBufferAttribute(p, i);
            const key = v.toArray().map(n => n.toFixed(5)).join(',');
            if (!lookup.has(key)) { lookup.set(key, points.length); points.push(v); neighbours.push(new Set()); }
            ids.push(lookup.get(key));
        }
        const edgeKey = (a,b) => a < b ? `${a}:${b}` : `${b}:${a}`;
        for (let i = 0; i < ids.length; i += 3) {
            const t = ids.slice(i, i+3);
            for (let j = 0; j < 3; j++) {
                const a=t[j], b=t[(j+1)%3], c=t[(j+2)%3], key=edgeKey(a,b);
                if (!edges.has(key)) edges.set(key,{a,b,opposite:[]});
                edges.get(key).opposite.push(c); neighbours[a].add(b); neighbours[b].add(a);
            }
        }
        const boundary = points.map(() => []);
        for (const e of edges.values()) if(e.opposite.length === 1) { boundary[e.a].push(e.b); boundary[e.b].push(e.a); }
        const moved = points.map((point,i) => {
            if (boundary[i].length === 2) return point.clone().multiplyScalar(.75).addScaledVector(points[boundary[i][0]],.125).addScaledVector(points[boundary[i][1]],.125);
            if (boundary[i].length) return point.clone();
            const n=neighbours[i].size, beta=n===3?3/16:3/(8*n);
            const result=point.clone().multiplyScalar(1-n*beta);
            neighbours[i].forEach(j=>result.addScaledVector(points[j],beta)); return result;
        });
        for(const e of edges.values()) {
            e.point=points[e.a].clone().add(points[e.b]).multiplyScalar(e.opposite.length===2?.375:.5);
            if(e.opposite.length===2) e.opposite.forEach(i=>e.point.addScaledVector(points[i],.125));
        }
        const positions=[], uvs=[], groups=[];
        const sourceGroups=geometry.groups.length?geometry.groups:[{start:0,count:p.count,materialIndex:0}];
        for(const group of sourceGroups) {
            const start=positions.length/3;
            for(let i=group.start;i<group.start+group.count;i+=3) {
                const [a,b,c]=ids.slice(i,i+3);
                const verts=[moved[a],moved[b],moved[c],edges.get(edgeKey(a,b)).point,edges.get(edgeKey(b,c)).point,edges.get(edgeKey(c,a)).point];
                const tex=[0,1,2].map(j=>uv?new THREE.Vector2().fromBufferAttribute(uv,i+j):new THREE.Vector2());
                tex.push(tex[0].clone().add(tex[1]).multiplyScalar(.5),tex[1].clone().add(tex[2]).multiplyScalar(.5),tex[2].clone().add(tex[0]).multiplyScalar(.5));
                for(const j of [0,3,5,3,1,4,5,4,2,3,4,5]) { positions.push(...verts[j].toArray()); uvs.push(...tex[j].toArray()); }
            }
            groups.push({start,count:positions.length/3-start,materialIndex:group.materialIndex});
        }
        const next=new THREE.BufferGeometry();next.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));next.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));next.groups=groups;
        // Weld normals across UV seams using the new vertex positions.
        next.computeVertexNormals();const sums=new Map(),np=next.attributes.position,nn=next.attributes.normal;
        for(let i=0;i<np.count;i++){const key=[np.getX(i),np.getY(i),np.getZ(i)].map(n=>n.toFixed(5)).join(',');if(!sums.has(key))sums.set(key,new THREE.Vector3());sums.get(key).add(new THREE.Vector3().fromBufferAttribute(nn,i));}
        for(let i=0;i<np.count;i++){const key=[np.getX(i),np.getY(i),np.getZ(i)].map(n=>n.toFixed(5)).join(',');const n=sums.get(key).normalize();nn.setXYZ(i,n.x,n.y,n.z);}
        geometry.dispose();geometry=next;
    }
    return geometry;
}
