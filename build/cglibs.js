import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ColladaExporter } from 'three/addons/exporters/ColladaExporter.js';

const diffuseColor = new THREE.Color();
const specularColor = new THREE.Color();

let bBottom;
let bLid;
let bBody;
let bFitLid;
let bNonBlinn;
let shading;
let vertexColors;
let wireMaterial, flatMaterial, gouraudMaterial, phongMaterial, texturedMaterial, normalMaterial, reflectiveMaterial;

export let camera, scene, renderer;
let cameraControls;
let effectController;
const teapotSize = 100; // vertical height of the teapot is about 2x this, we scale it to millimeters.
let ambientLight, light;

let tess = - 1;	// force initialization

let teapot, textureCube;
let __createSceneObject;
let boxes;

export function removeAllChildren(){
    boxes.forEach(element => {
        scene.remove(element)
    });

    boxes = [];
}

let  __screenscale = 1;
let __screenleft = 0;
let __screentop = 0;

function onWindowResize() {

    const canvasWidth = window.innerWidth * __screenscale;
    const canvasHeight = window.innerHeight * __screenscale;

    renderer.setSize( canvasWidth, canvasHeight );

    camera.aspect = canvasWidth / canvasHeight;
    camera.updateProjectionMatrix();

    render();

}

export function init(func_createSceneObject, _scale, _left, _top) {
    __screenscale = _scale;
    __screenleft = _left;
    __screentop = _top;

    const container = document.createElement( 'div' );
    container.id = 'three_container';
    document.body.appendChild( container );

    container.style.position = 'absolute';
    container.style.left = __screenleft + 'px';
    container.style.top = __screentop + 'px';

    const canvasWidth = window.innerWidth * __screenscale;
    const canvasHeight = window.innerHeight * __screenscale;
    
    boxes = [];
    __createSceneObject = func_createSceneObject;
    
    // CAMERA
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 100000 );
    camera.position.set(15000, 15000, 10000 );

    // LIGHTS
    ambientLight = new THREE.AmbientLight( 0x333333 );	// 0.2

    light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
    // direction is set in GUI

    // RENDERER
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    
    renderer.setSize( canvasWidth, canvasHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );
    

    // EVENTS
    window.addEventListener( 'resize', onWindowResize );

    // CONTROLS
    cameraControls = new OrbitControls( camera, renderer.domElement );
    cameraControls.addEventListener( 'change', render );

    // TEXTURE MAP
    const loader = new THREE.TextureLoader();

    const textureMap = loader.load( 'textures/uv_grid_opengl.jpg' );
    textureMap.wrapS = textureMap.wrapT = THREE.RepeatWrapping;
    textureMap.anisotropy = 16;
    textureMap.encoding = THREE.sRGBEncoding;

    // NORMAL MAP

    const diffuseMap = loader.load( 'textures/floors/FloorsCheckerboard_S_Diffuse.jpg' );
    const normalMap = loader.load( 'textures/floors/FloorsCheckerboard_S_Normal.jpg' );

    // REFLECTION MAP
    const path = 'textures/cube/pisa/';
    const urls = [
        path + 'px.png', path + 'nx.png',
        path + 'py.png', path + 'ny.png',
        path + 'pz.png', path + 'nz.png'
    ];

    textureCube = new THREE.CubeTextureLoader().load( urls );
    textureCube.encoding = THREE.sRGBEncoding;

    // MATERIALS
    const materialColor = new THREE.Color();
    materialColor.setRGB( 1.0, 1.0, 1.0 );

    wireMaterial = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, wireframe: true } );

    flatMaterial = new THREE.MeshPhongMaterial( { color: materialColor, specular: 0x000000, flatShading: true, side: THREE.DoubleSide } );

    gouraudMaterial = new THREE.MeshLambertMaterial( { color: materialColor, side: THREE.DoubleSide } );

    phongMaterial = new THREE.MeshPhongMaterial( { color: materialColor, side: THREE.DoubleSide } );

    texturedMaterial = new THREE.MeshPhongMaterial( { color: materialColor, map: textureMap, side: THREE.DoubleSide } );

    normalMaterial = new THREE.MeshPhongMaterial( { color: materialColor, map: diffuseMap, normalMap: normalMap, side: THREE.DoubleSide } );

    reflectiveMaterial = new THREE.MeshPhongMaterial( { color: materialColor, envMap: textureCube, side: THREE.DoubleSide } );

    // scene itself
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xAAAAAA );

    scene.add( ambientLight );
    scene.add( light );

    // GUI
    setupGui();

}

export function setupGui() {

    effectController = { shininess: 40.0, ka: 0.17, kd: 0.51, ks: 0.2, metallic: true,

        hue:	0.121, saturation: 0.73, lightness: 0.66, lhue:	0.04, lsaturation: 0.01,	// non-zero so that fractions will be shown
        llightness: 1.0,
        vertexColors: false,

        // bizarrely, if you initialize these with negative numbers, the sliders
// will not show any decimal places.
        lx: 0.32,
        ly: 0.39,
        lz: 0.7,
        newTess: 15,
        bottom: true,
        lid: true,
        body: true,
        fitLid: false,
        nonblinn: false,
        newShading: 'glossy',

        export: exportCollada
    };

    let h;

    const gui = new GUI();
    //console.log("GUI-E");

    // material (attributes)

    /*h = gui.addFolder( 'Material control' );

    h.add( effectController, 'shininess', 1.0, 400.0, 1.0 ).name( 'shininess' ).onChange( render );
    h.add( effectController, 'kd', 0.0, 1.0, 0.025 ).name( 'diffuse strength' ).onChange( render );
    h.add( effectController, 'ks', 0.0, 1.0, 0.025 ).name( 'specular strength' ).onChange( render );
    h.add( effectController, 'metallic' ).onChange( render );

    // material (color)

    h = gui.addFolder( 'Material color' );

    h.add( effectController, 'hue', 0.0, 1.0, 0.025 ).name( 'hue' ).onChange( render );
    h.add( effectController, 'saturation', 0.0, 1.0, 0.025 ).name( 'saturation' ).onChange( render );
    h.add( effectController, 'lightness', 0.0, 1.0, 0.025 ).name( 'lightness' ).onChange( render );
    h.add( effectController, 'vertexColors' ).onChange( render );

    // light (point)

    h = gui.addFolder( 'Lighting' );

    h.add( effectController, 'lhue', 0.0, 1.0, 0.025 ).name( 'hue' ).onChange( render );
    h.add( effectController, 'lsaturation', 0.0, 1.0, 0.025 ).name( 'saturation' ).onChange( render );
    h.add( effectController, 'llightness', 0.0, 1.0, 0.025 ).name( 'lightness' ).onChange( render );
    h.add( effectController, 'ka', 0.0, 1.0, 0.025 ).name( 'ambient' ).onChange( render );

    // light (directional)

    h = gui.addFolder( 'Light direction' );

    h.add( effectController, 'lx', - 1.0, 1.0, 0.025 ).name( 'x' ).onChange( render );
    h.add( effectController, 'ly', - 1.0, 1.0, 0.025 ).name( 'y' ).onChange( render );
    h.add( effectController, 'lz', - 1.0, 1.0, 0.025 ).name( 'z' ).onChange( render );

    h = gui.addFolder( 'Tessellation control' );
    h.add( effectController, 'newTess', [ 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 40, 50 ] ).name( 'Tessellation Level' ).onChange( render );
    h.add( effectController, 'lid' ).name( 'display lid' ).onChange( render );
    h.add( effectController, 'body' ).name( 'display body' ).onChange( render );
    h.add( effectController, 'bottom' ).name( 'display bottom' ).onChange( render );
    h.add( effectController, 'fitLid' ).name( 'snug lid' ).onChange( render );
    h.add( effectController, 'nonblinn' ).name( 'original scale' ).onChange( render );

    // shading

    gui.add( effectController, 'newShading', [ 'wireframe', 'flat', 'smooth', 'glossy', 'textured', 'normal', 'reflective' ] ).name( 'Shading' ).onChange( render );*/

    h = gui.addFolder( 'Export' );
    h.add( effectController, 'export' ).name( 'Export Collada' );

    //console.log(h);
}

export const exporter = new ColladaExporter();

export function exportCollada(fname) {

    const result = exporter.parse( scene, undefined, { upAxis: 'Y_UP', unitName: 'millimeter', unitMeter: 0.001 } );
    let materialType = 'Sample';

    if ( shading === 'wireframe' ) {

        materialType = 'Constant';

    }

    if ( shading === 'smooth' ) {

        materialType = 'Lambert';

    }

    if(fname == undefined)
        fname = 'teapot_' + shading + '_' + materialType;

    saveString( result.data, fname + '.dae');

    result.textures.forEach( tex => {

        saveArrayBuffer( tex.data, `${ tex.name }.${ tex.ext }` );

    } );

}

//export let link;
const link = document.createElement( 'a' );
//CG.link = link;
link.style.display = 'none';
document.body.appendChild( link );

function save( blob, filename ) {
    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();
}

function saveString( text, filename ) {
    save( new Blob( [ text ], { type: 'text/plain' } ), filename );
}

function saveArrayBuffer( buffer, filename ) {
    save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );

}


export function render() {
    ////console.log('camera ' + camera.position.x + ',' + camera.position.y + ',' + camera.position.z + ',');

    if ( effectController.newTess !== tess ||
        effectController.bottom !== bBottom ||
        effectController.lid !== bLid ||
        effectController.body !== bBody ||
        effectController.fitLid !== bFitLid ||
        effectController.nonblinn !== bNonBlinn ||
        effectController.newShading !== shading ||
        effectController.vertexColors !== vertexColors ) 
    {

        tess = effectController.newTess;
        bBottom = effectController.bottom;
        bLid = effectController.lid;
        bBody = effectController.body;
        bFitLid = effectController.fitLid;
        bNonBlinn = effectController.nonblinn;
        shading = effectController.newShading;
        vertexColors = effectController.vertexColors;

        //createNewTeapot();
        __createSceneObject();

    }

    // We're a bit lazy here. We could check to see if any material attributes changed and update
    // only if they have. But, these calls are cheap enough and this is just a demo.
    phongMaterial.shininess = effectController.shininess;
    texturedMaterial.shininess = effectController.shininess;
    normalMaterial.shininess = effectController.shininess;

    diffuseColor.setHSL( effectController.hue, effectController.saturation, effectController.lightness );
    if ( effectController.metallic ) {

        // make colors match to give a more metallic look
        specularColor.copy( diffuseColor );

    } else {

        // more of a plastic look
        specularColor.setRGB( 1, 1, 1 );

    }

    diffuseColor.multiplyScalar( effectController.kd );
    flatMaterial.color.copy( diffuseColor );
    gouraudMaterial.color.copy( diffuseColor );
    phongMaterial.color.copy( diffuseColor );
    texturedMaterial.color.copy( diffuseColor );
    normalMaterial.color.copy( diffuseColor );

    specularColor.multiplyScalar( effectController.ks );
    phongMaterial.specular.copy( specularColor );
    texturedMaterial.specular.copy( specularColor );
    normalMaterial.specular.copy( specularColor );

    // Ambient's actually controlled by the light for this demo
    ambientLight.color.setHSL( effectController.hue, effectController.saturation, effectController.lightness * effectController.ka );

    light.position.set( effectController.lx, effectController.ly, effectController.lz );
    light.color.setHSL( effectController.lhue, effectController.lsaturation, effectController.llightness );

    // skybox is rendered separately, so that it is always behind the teapot.
    if ( shading === 'reflective' ) {

        scene.background = textureCube;

    } else {

        scene.background = null;

    }

    
    renderer.render( scene, camera );

}

// function fitCameraToObject( camera, object, offset, controls ) {

//     offset = offset || 1.25;

//     const boundingBox = new THREE.Box3();

//     // get bounding box of object - this will be used to setup controls and camera
//     boundingBox.setFromObject( object );

//     const center = boundingBox.getCenter();

//     const size = boundingBox.getSize();

//     // get the max side of the bounding box (fits to width OR height as needed )
//     const maxDim = Math.max( size.x, size.y, size.z );
//     const fov = camera.fov * ( Math.PI / 180 );
//     let cameraZ = Math.abs( maxDim / 4 * Math.tan( fov * 2 ) );

//     cameraZ *= offset; // zoom out a little so that objects don't fill the screen

//     camera.position.z = cameraZ;

//     const minZ = boundingBox.min.z;
//     const cameraToFarEdge = ( minZ < 0 ) ? -minZ + cameraZ : cameraZ - minZ;

//     camera.far = cameraToFarEdge * 3;
//     camera.updateProjectionMatrix();

//     // if ( controls ) {

//     //   // set camera to rotate around center of loaded object
//     //   controls.target = center;

//     //   // prevent camera from zooming out far enough to create far plane cutoff
//     //   controls.maxDistance = cameraToFarEdge * 2;

//     //   controls.saveState();

//     // } else {

//         camera.lookAt( center );

//    }
//  }

export function addChild()
{
    const args = Array.from(arguments);

    args.forEach(obj => {
        scene.add(obj);
        boxes.push(obj);
    });
    
}

var getKeys = function(obj){
    var keys = [];
    for(var key in obj){
       keys.push(key);
    }
    return keys;
 }

export function defMaterial(name)
{
    const clr = new THREE.Color();

    if(name == "#Wall")
        clr.setRGB( 1.0, 1.0, 1.0 );
    else
        clr.setRGB(0.5, 0.5, 0.5);

    const mtl = new THREE.MeshBasicMaterial( { name: name, color: clr, side: THREE.DoubleSide } );
    
    return mtl;
}

document.onkeydown = checkKey;

function checkKey(e) {

    e = e || window.event;
    //console.log(e.keyCode);
    var delta = 200;

    if (e.keyCode == '65') { // A
        camera.position.x = camera.position.x - delta;
    }
    else if (e.keyCode == '68') {
        //console.log('D');
        camera.position.x = camera.position.x + delta;
    }
    else if (e.keyCode == '87') {
        //console.log('W');
        camera.position.z = camera.position.z - delta;
    }
    else if (e.keyCode == '83') {
        //console.log('S');
        camera.position.z = camera.position.z + delta;
    }
    else if (e.keyCode == '69') {
        //console.log('E');
        camera.rotation.x += 0.1;
        camera.rotation.y += 0.1;
    }
    else if (e.keyCode == '81') {
        //console.log('Q');
        camera.rotation.x -= 0.1;
        camera.rotation.y -= 0.1;
    }
    else if (e.keyCode == '38') {
        //console.log('up arrow');
        camera.position.z = camera.position.z - delta;
    }
    else if (e.keyCode == '40') {
        //console.log('down arrow');
        camera.position.z = camera.position.z + delta;
    }
    else if (e.keyCode == '37') {
        camera.position.x = camera.position.x - delta;
    }
    else if (e.keyCode == '39') {
        console.log('right arrow');
        camera.position.x = camera.position.x + delta;
    }

    render()
}
