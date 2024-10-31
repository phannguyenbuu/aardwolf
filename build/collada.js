import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import * as CG from './cglibs.js';

let geo_dict = {};
let mtl_index = 0;

CG.init(function() {
    CG.removeAllChildren();

    var __svg = document.getElementsByTagName('svg')[0];
    var __groups = __svg.getElementsByTagName('g');
    
    var _sc = 1;

    if(document.title.includes("PLAN"))
        _sc = 1000;

    for(let i = 0; i < __groups.length; i++)
    {
        //console.log(__groups[i].classList[0]);
        let _id = __groups[i].classList[0];

        if(_id == undefined) continue;
                
        geo_dict[_id] = [];
        //console.log("length",__polygons.length);
        for(let j = 0; j < __groups[i].getElementsByTagName('polygon').length 
            + __groups[i].getElementsByTagName('polyline').length; j++)
                geo_dict[_id].push(undefined);
        
        let __polygons = __groups[i].getElementsByTagName('polygon');
        for(let j = 0; j < __polygons.length; j++)
        {
            let _pts = ReadPolylinePoints(__polygons[j].getAttribute('points'), _sc);
            //console.log(obj.shape);
            
            if(_pts.length > 0)
            {
                let obj = {shape:null, profile: null, mod:'', mtl:'', z:0, h:0};
                obj.shape = _pts;

                if(_id.includes('zone'))
                {
                    obj.z = 0;
                    obj.h = 200;
                } 
                else if(_id.includes('cross'))
                {
                    obj.z = 50;
                    obj.h = 20;
                }
                else if(_id.includes('ROAD'))
                {
                    obj.z = 0;
                    obj.h = 50;
                }

                obj.mtl = _id;
                mkExtrude(obj);
            }
        }
                 
        let __polylines = __groups[i].getElementsByTagName('polyline');

        for(let j = 0; j < __polylines.length; j++)
        {
            let _pts = ReadPolylinePoints(__polylines[j].getAttribute('points'), _sc, true);
                        
            if(_pts.length > 0)
            {
                let obj = {shape:null, path: null, mod:'', mtl:'', z:0, profileName:null};
                obj.path = _pts;
                obj.mtl = _id;
                
                if(_id.includes('pavement'))
                    obj.profileName = "pavement_border";
                else if(_id.includes('center'))
                {
                    obj.z = 50;
                    obj.profileName = "center_road";
                }

                if(obj.profileName != null)
                    SweepProfile(obj);
            }
        }

        
    }

    CG.camera.lookAt(CG.scene.position);
    CG.render();
}, 1, 0, 0);

CG.render();

const collection = document.getElementsByClassName("lil-gui allow-touch-styles root autoPlace");
collection[0].style.visibility = "hidden";

window.export3D = function() {CG.exportCollada("sk_plan_3d_obj");};

function mkShape(res)
{
    let shape = new THREE.Shape();
    shape.moveTo(res[0].x, res[0].y);

    for(let i = 1; i < res.length; i++)
        shape.lineTo( res[i].x, res[i].y);
    
    return shape;
}

function ReadPolylinePoints(val, sc = 1, to_vector3 = false)
{
    let pts = [];

    val.split(' ').forEach(s => {
        let ar = s.split(',');

        pts.push( to_vector3 ? new THREE.Vector3(eval(ar[0]) * sc, eval(ar[1]) * sc, 0) 
            : new THREE.Vector2(eval(ar[0]) * sc,eval(ar[1]) * sc));
    });
    
    return pts;
}

function mkExtrude(obj, extrude = true) {
    var extrudeSettings =  extrude ?
    {
        steps: 1,
        depth: -obj.h,
        bevelEnabled: true,
        bevelThickness: 0,
        bevelSize: 0,
        bevelOffset: 0,
        bevelSegments: 0
    } 
    :
    {
        steps: 64,
        bevelEnabled: false,
        extrudePath: new THREE.CatmullRomCurve3(obj.path)
    };
    
    var ls = geo_dict[obj.mtl];    

    for(let i = 0; i < ls.length; i++)
        if(ls[i] == undefined)
        {
            ls[i] = new THREE.ExtrudeGeometry(mkShape(obj.shape), extrudeSettings);
            break;
        }

    if(ls.every(function(itm) { return itm != undefined;  }))
    {
        const geometry = BufferGeometryUtils.mergeBufferGeometries(ls);
        geometry.computeBoundingSphere();


        //var material = createElementMaterial(obj.mtl);

        var mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({name:obj.mtl}));

        mesh.rotation.x = Math.PI / 2;
        mesh.name = obj.mtl;

        CG.scene.add(mesh);
    }
}

function SweepProfile(obj)
{
    let filePath = '../profiles/' + obj.profileName + '.html';
    let rawFile = new XMLHttpRequest();

    rawFile.open("GET", filePath , true);
    rawFile.send(null);

    rawFile.onreadystatechange = function (){
        if(rawFile.readyState === 4){
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var div = document.createElement("div");
                div.innerHTML = rawFile.responseText;
                                
                var __svg = div.getElementsByTagName("svg");
                
                if(__svg.length > 0)
                {
                    ["polyline", "polygon"].forEach(function (_k) {
                        var _plines = __svg[0].getElementsByTagName(_k);

                        for(let i = 0; i < _plines.length; i++)	
                        {
                            let _pts =  ReadPolylinePoints(_plines[i].getAttribute("points"), 1);

                            if(_pts.length > 0)
                            {
                                obj.shape = _pts;
                                mkExtrude(obj, false);
                            }
                        }
                    });
                }
            }
        }
    }
}



