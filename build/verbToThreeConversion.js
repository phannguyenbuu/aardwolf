// Utility methods to support converting verb.geom types to THREE.Geometry

(function(verb){

    verb.geom.NurbsCurve.prototype.toThreeGeometry = function(){
        return tessellateCurve( this );
    }

    verb.geom.NurbsSurface.prototype.toThreeGeometry = function(){
        return tessellateSurface( this );
    }

    function asVector3(pts){
        return pts.map(function(x){
            return new THREE.Vector3(x[0],x[1],x[2]);
        });
    }

    function tessellateCurve( curve ){
        var geometry = new THREE.Geometry();
        geometry.vertices = asVector3( curve.tessellate() );
        return geometry;
    }

    function tessellateSurface(srf) {

        var tess = srf.tessellate();

        var geometry = new THREE.BufferGeometry();

        geometry.vertices = asVector3( tess.points );

        // geometry.faces = tess.faces.map(function(faceIndices){
        //     var normals = faceIndices.map(function(x){
        //         var vn = tess.normals[x];
        //         return new THREE.Vector3( vn[0], vn[1], vn[2] );
        //     });

        //     return new THREE.Plane(faceIndices[0],faceIndices[1],faceIndices[2], normals);
        // });

        var positions = [];

        tess.faces.forEach(faceIndices => {
            faceIndices.forEach(x => {
                var vn = tess.normals[x];
                positions.push(vn[0],vn[1],vn[2]);
            });
        });



        // const geometry = new THREE.BufferGeometry();

        // const positions = [
        // 0,   0, 0,    // v1
        // 0, 500, 0,   // v2
        // 0, 500, 500  // v3
        // ];
        
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        geometry.computeVertexNormals();
        
        //const object = new THREE.Mesh( geometry, new THREE.MeshNormalMaterial() );
        //scene.add(object);









        return geometry;
    }

})(verb);