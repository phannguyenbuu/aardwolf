// ----------------------------Bắt đầu 3D--------------------------------

import * as THREE from 'three'
import { OrbitControls } from '/jsm/controls/OrbitControls.js'
import { FBXLoader } from '/jsm/loaders/FBXLoader.js'
import Stats from '/jsm/libs/stats.module.js'

const scene = new THREE.Scene();
var controls;
var renderer;
var camera;

function _loadFBX(scenename, o) {
    const filename = _fullname(scenename)
    const fbxLoader = new FBXLoader()
    fbxLoader.load(
        filename,
        (object) => {
            object.traverse(function (child) {
                if (child.isMesh) {
                    // child.material = material
                    if (child.material) {
                        child.material.transparent = false
                    }
                }
            })
            object.position.set(o.x, o.z, o.y)
            object.rotation.y = Math.PI / 180 * o.rot;
            scene.add(object)
            progressBar.style.display = 'none'
        },
        (xhr) => {
            if (xhr.lengthComputable) {
                var percentComplete = (xhr.loaded / xhr.total) * 100
                progressBar.value = percentComplete
                progressBar.style.display = 'block'
            }
        },
        (error) => {
            console.log(error)
        }
    )
}

function init() {
    scene.add(new THREE.AxesHelper(5))
    
    const light = new THREE.PointLight(0xffffff, 1)
    light.position.set(2000,2000,2000)
    scene.add(light)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-500, 500, 500).normalize(); // Vị trí của ánh sáng
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040); // Ánh sáng mềm
    scene.add(ambientLight);
    const w = window.innerWidth;
    const h = window.innerHeight;

    camera = new THREE.PerspectiveCamera(75, w/h , 0.1, 100000)
    camera.position.set(1200, 1500, 7000)

    renderer = new THREE.WebGLRenderer()
    renderer.setSize(w, h)
    renderer.setClearColor(0xd1d2d3); // Thiết lập màu nền xám

    const container = document.getElementById('threejs-container');
    container.appendChild(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement)
    controls.minDistance = 0; // Giới hạn zoom gần nhất
    controls.maxDistance = 10000; // Giới hạn zoom xa nhất
    controls.enableDamping = true
    controls.target.set(1200, 1500, 0)


};

function _fullname(s) {
    return 'models/aardwolf_all_part_' + s + '.fbx';
}

function __extract_point3(inputString)
{
    const p1Match = inputString.match(/p1_(-?\d+)_(-?\d+)_(-?\d+)/);
    const p2Match = inputString.match(/p2_(-?\d+)_(-?\d+)_(-?\d+)/);

    let p1, p2;
    if (p1Match && p2Match) {
        // Lấy tọa độ của p1 và p2
        p1 = { x: parseFloat(p1Match[1]), y: parseFloat(p1Match[2]), z: parseFloat(p1Match[3]) };
        p2 = { x: parseFloat(p2Match[1]), y: parseFloat(p2Match[2]), z: parseFloat(p2Match[3]) };
    }

    return [p1, p2]
}

function clearScene(scene) {
    // Tạo bản sao của scene.children để tránh ảnh hưởng khi xóa các đối tượng
    const objects = [...scene.children];

    objects.forEach((object) => {
        // Kiểm tra nếu đối tượng không phải là ánh sáng
        if (!object.isLight) {
            scene.remove(object);

            // Giải phóng bộ nhớ nếu có geometry và material
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach((material) => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        }
    });
}

// Sử dụng hàm


function _load_a_Scene()
{
    clearScene(scene);
    let ar = select_crane();
    let scenename = ar[0];

    var ls = __extract_point3(scenename);
    console.log(ls,_fullname(scenename));

    const p1 = ls[0], p2 = ls[1];

    
    _loadFBX(scenename, {x:0, y:0, z:0, rot:0});
    _loadFBX(ar[1], {x:p1.x, y:0, z:p1.z, rot:0});
    _loadFBX(ar[2], {x:p2.x, y:p2.y, z:p2.z, rot:0});
    _loadFBX(ar[3], {x:p2.x - tube_offset, y:p2.y, z:p2.z - tube_height, rot:0});
    _loadFBX(ar[4], {x:p2.x - tube_offset, y:p2.y, z:p2.z - tube_height, rot:0});
}


document.addEventListener("DOMContentLoaded", function() {
    init();
    _load_a_Scene();
});



function handleRadioChange(name, getValueCallback) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((radio) => {
        radio.addEventListener('change', function () {
            const value = getValueCallback(this);
            localStorage.setItem(name, value);
            _load_a_Scene();
        });
    });
}

// Đảm bảo mọi radio sẽ được xử lý
handleRadioChange('craneType', (radio) => radio.id);
handleRadioChange('jibLength', (radio) => {
    const numbers = radio.id.match(/\d+/g); // Tìm tất cả các số trong chuỗi
    return numbers ? numbers.map(Number)[0] : null; // Chuyển các chuỗi số thành số và trả về mảng số
});
handleRadioChange('loadType', (radio) => radio.id);
handleRadioChange('workLoadLimit', () => {
    // Đối với workLoadLimit, bạn không cần phải lưu giá trị nào từ radio, chỉ cần load lại scene.
    return null; 
});


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}
window.addEventListener('resize', onWindowResize, false)

document.getElementById('bottom-view').addEventListener('click', function(e) {
    // Đặt vị trí camera tại (1200, 1500, 7000)
    camera.position.set(0, -8000, 0);
});

document.getElementById('front-view').addEventListener('click', function(e) {
    // Đặt vị trí camera tại (1200, 1500, 7000)
    camera.position.set(0, 1500, 7000);
});

document.getElementById('left-view').addEventListener('click', function(e) {
    // Đặt vị trí camera tại (1200, 1500, 7000)
    camera.position.set(7000, 1500, 0);
});

document.getElementById('right-view').addEventListener('click', function(e) {
    // Đặt vị trí camera tại (1200, 1500, 7000)
    camera.position.set(-7000, 1500, 0);
});

document.getElementById('top-view').addEventListener('click', function(e) {
    // Đặt vị trí camera tại (1200, 1500, 7000)
    camera.position.set(0, 8000, 0);
});

document.getElementById('ortho-view').addEventListener('click', function(e) {
    // Đặt vị trí camera tại (1200, 1500, 7000)
    camera.position.set(5000, 5000, 5000);
});

// const stats = new Stats()

// window.addEventListener('click', () => {
//     const cameraPosition = camera.position;
//     const cameraInfoDiv = document.getElementById('cameraInfo');
//     cameraInfoDiv.innerHTML = `Camera Position: x: ${cameraPosition.x.toFixed(2)}, y: ${cameraPosition.y.toFixed(2)}, z: ${cameraPosition.z.toFixed(2)}`;
//     cameraInfoDiv.style.display = 'block'; // Hiển thị thông tin camera
// });
function animate() {
    requestAnimationFrame(animate)

    if(controls)
        controls.update()

    render()

    // stats.update()
}
function render() {
    if(renderer)
        renderer.render(scene, camera)
}
animate()
