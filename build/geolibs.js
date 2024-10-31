import * as THREE from 'three';

import * as CG from './cglibs.js';
import * as SL from './slice.js';
import * as BufferGeo from './BufferGeometryUtils.js';

export function AngleVsBaseVector(v)
{
    var vector2 = new THREE.Vector2(1, 0);
    var sin = v.x * vector2.y - vector2.x * v.y;
    var cos = v.x * vector2.x + v.y * vector2.y;
    ////console.log('Sin+cos: ' + sin + ',' + cos);

    return Math.atan2(sin, cos);
}

export function getBounding(mesh)
{
    mesh.geometry.computeBoundingBox();
    return mesh.geometry.boundingBox;
}

export function gShape2LongSegs(shape)
{
    let segments = [];

    ////console.log("_gShape2LongSegs " + shape.length);
    let pts = shape.extractPoints().shape;

    for(let i = 0; i < pts.length; i++)
        segments.push([pts[i], pts[i < pts.length - 1 ? i + 1: 0]]);
    
    segments.sort((a,b)=> b[0].distanceTo(b[1]) - a[0].distanceTo(a[1]));
    ////console.log(segments[0], segments[1]);

    return [segments[0],segments[1]];
}

export function ShapeToSegs(shape)
{
    let segments = [];

    ////console.log("_gShape2LongSegs " + shape.length);
    let pts = shape.extractPoints().shape;

    for(let i = 0; i < pts.length; i++)
        segments.push([pts[i], pts[i < pts.length - 1 ? i + 1: 0]]);
    
    segments.sort((a,b)=> b[0].distanceTo(b[1]) - a[0].distanceTo(a[1]));
    ////console.log(segments[0], segments[1]);

    return segments.map(s => mkShape(s));
}

function mkBox(sX, sY, sZ, x , y, z) {
    let boxGmt = new THREE.BoxGeometry( sX,sY,sZ );
    
    let box = new THREE.Mesh( boxGmt, CG.defMaterial());

    boxGmt.translate( x,y,z);

    CG.addChild(box);
}





//SWEEP PROFILES


export function mkSweep2(obj) {
	var profileShape = obj.profile;
    var shape = obj.shape;
    var _cote = obj.z;
    var contourClosed = true;
    var openEnded = false;
    var profileMaterial = obj.mtl;

	contourClosed = contourClosed !== undefined ? contourClosed : true;
	openEnded = openEnded !== undefined ? openEnded : false;
	openEnded = contourClosed === true ? false : openEnded;
	profileMaterial = profileMaterial !== undefined ? profileMaterial : false;
	
    let contour = [];

    //console.log("SHP:" + shape);
    shape.extractPoints().shape.forEach(__p => {contour.push(__p.x); contour.push(__p.y);});
    if( contourClosed ) contour.push( contour[ 0 ], contour[ 1 ] );

    //console.log('profile:' + profileShape);
    //console.log('contour:' + contour);

	var hs1 = contour.length / 2;
	var rs1 = profileShape.length / 2;
	var hs = hs1 - 1; // height segments 
	var rs = rs1 - 1; // radius segments
	
	var faceCount = hs * rs * 2 + ( openEnded ? 0 : rs * 2 );
	var posCount = hs1 * rs1 + ( openEnded ? 0 : 2 );
	
	var g = new THREE.BufferGeometry( );
	g.indices = new Uint32Array( faceCount * 3 );
	g.positions = new Float32Array( posCount * 3 );
	
	g.setIndex( new THREE.BufferAttribute( g.indices, 1 ) );
	g.setAttribute( 'position', new THREE.BufferAttribute( g.positions, 3 ) );
	
	var a, b1, c1, b2, c2;
	var i1, i2;
	var xc0, yc0, xc1, yc1, xc2, yc2, xSh, xDiv;
	var dx0, dy0, dx2, dy2;
	var e0x, e0y,e0Length, e2x, e2y, e2Length, ex, ey, eLength;
	var phi, bend;
	var x, y, z;
	var vIdx, posIdx;
	var epsilon = 0.000001;
	var idx = 0;
	
    //console.log('ok1');

	for ( var i = 0; i < hs; i ++ ) {
		
		if ( profileMaterial ) g.addGroup( idx, rs * 6, i ); // MultiMaterial support
		
		i1 = i + 1;
		
		for ( var j = 0; j < rs; j ++ ) {
			
			// 2 faces / segment,  3 vertex indices
			a =  rs1 * i + j;
			c1 = rs1 * i1 + j; // left 
			b1 = c1 + 1;
			//c2 = b1;         // right
			b2 = a + 1;
			
			g.indices[ idx     ] = a; // left 
			g.indices[ idx + 1 ] = b1;
			g.indices[ idx + 2 ] = c1; 
			
			g.indices[ idx + 3 ] = a; // right 
			g.indices[ idx + 4 ] = b2,
			g.indices[ idx + 5 ] = b1; // = c2
			
			if ( !profileMaterial ) g.addGroup( idx, 6, j ); // MultiMaterial support
			
			idx += 6;
			
		}
		
	}

    //console.log('ok2');
	
	if( !openEnded ) {
		
		g.addGroup( idx, rs * 3, rs ); // MultiMaterial support
		
		a = hs1 * rs1;
		
		for ( var j = 0; j < rs; j ++ ) {
			
			g.indices[ idx     ] = a; 
			g.indices[ idx + 1 ] = j + 1;
			g.indices[ idx + 2 ] = j;
			
			idx += 3;
			
		}
		
		g.addGroup( idx, rs * 3, rs + 1 ); // MultiMaterial support
		
		a += 1; 
		
		for ( var j = rs1 + 1; j > 1; j -- ) {
			
			g.indices[ idx     ] = a; 
			g.indices[ idx + 1 ] = a - j;
			g.indices[ idx + 2 ] = a - j + 1;
			
			idx += 3;
			
		}
		
	}
	
	for ( var i = 0; i < hs1; i ++ ) {
		
		i2 = 2 * i; 
		 
		xc1 = contour[ i2 ];
		yc1 = contour[ i2 + 1 ];
				
		if ( i === 0 ) {
			
			xc0 = contour[ ( hs - 1 ) * 2 ]; // penultimate point
			yc0 = contour[ ( hs - 1 ) * 2 + 1 ];
			
		} else {
					 
			xc0 = contour[ i2 - 2 ]; 	// previous point
			yc0 = contour[ i2 - 1 ];
			
		}
		
		if ( i === hs ) {
			
			xc2 = contour[ 2 ];			// second point
			yc2 = contour[ 3 ];
			
		} else {
			 
			xc2 = contour[ i2 + 2 ]; 	// next point
			yc2 = contour[ i2 + 3 ];
			
		}	
		
		if ( !contourClosed ) {
			
			if ( i === 0 ) {
				
				// direction
				dx2 = xc2 - xc1;
				dy2 = yc2 - yc1;
				
				// unit vector
				e2Length = Math.sqrt( dx2 * dx2 + dy2 * dy2 );
				
				e2x = dx2 / e2Length;
				e2y = dy2 / e2Length;
				
				// orthogonal
				ex = e2y;
				ey = -e2x;
				
			}
			
			if ( i === hs ) {
				
				// direction
				
				dx0 = xc1 - xc0;
				dy0 = yc1 - yc0;
				
				// unit vector
				e0Length = Math.sqrt( dx0 * dx0 + dy0 * dy0 );
				
				e0x = dx0 / e0Length;
				e0y = dy0 / e0Length;
				
				// orthogonal
				ex = e0y;
				ey = -e0x;
				
			}
			
			xDiv = 1;
			bend = 1;
			
		}
		
		if ( ( i > 0 && i < hs ) || contourClosed ) {
			
			// directions
			
			dx0 = xc0 - xc1;
			dy0 = yc0 - yc1;
			
			dx2 = xc2 - xc1;
			dy2 = yc2 - yc1;
			
			if( Math.abs( ( dy2 / dx2 ) - ( dy0 / dx0 ) ) < epsilon ) { // prevent 0
				
				dy0 += epsilon;
				
			}
			
			if( Math.abs( ( dx2 / dy2 ) - ( dx0 / dy0 ) ) < epsilon ) { // prevent 0
				
				dx0 += epsilon;
				
			}  
			
			// unit vectors
			
			e0Length = Math.sqrt( dx0 * dx0 + dy0 * dy0 );
			
			e0x = dx0 / e0Length;
			e0y = dy0 / e0Length;
			
			e2Length = Math.sqrt( dx2 * dx2 + dy2 * dy2 );
			
			e2x = dx2 / e2Length;
			e2y = dy2 / e2Length;
			
			// direction transformed 
			
			ex = e0x + e2x;
			ey = e0y + e2y;
			
			eLength = Math.sqrt( ex * ex + ey * ey );
			
			ex = ex / eLength;
			ey = ey / eLength;
			
			phi = Math.acos( e2x * e0x + e2y * e0y ) / 2;
			
			bend = Math.sign( dx0 * dy2 - dy0 * dx2 ); // z cross -> curve bending
			
			xDiv = Math.sin( phi );
			
		}
		
		for ( var j = 0; j < rs1; j ++ ) {
			
			xSh = profileShape[ j * 2 ];
			
			x = xc1 + xSh / xDiv * bend * ex; 
			y = yc1 + xSh / xDiv * bend * ey;
			z = profileShape[ j * 2 + 1 ];	 // ySh
			
			vIdx = rs1 * i + j;
			
			posIdx = vIdx * 3;
			
			g.positions[ posIdx ] = x;
			g.positions[ posIdx + 1 ] = y;
			g.positions[ posIdx + 2 ] = z;
			
		}
		
	}
	
	if( !openEnded ) {
		
		g.positions[ hs1 * rs1 * 3 ] = contour[ 0 ];
		g.positions[ hs1 * rs1 * 3 + 1 ] = contour[ 1 ];
		g.positions[ hs1 * rs1 * 3 + 2 ] = 0;
		
		g.positions[ hs1 * rs1 * 3 + 3 ] = contour[ hs * 2 ];
		g.positions[ hs1 * rs1 * 3 + 4 ] = contour[ hs * 2 + 1 ];
		g.positions[ hs1 * rs1 * 3 + 5 ] = 0;
		
	}
	//console.log('ok3');
	g.computeVertexNormals();
	console.log('cote:' + _cote);

    let mesh = new THREE.Mesh(g, CG.defMaterial(profileMaterial));

    mesh.position.y = _cote;
    mesh.rotation.x = Math.PI / 2;
    
    CG.addChild(mesh);
	return mesh;
}
