// ----------------------------Bắt đầu 3D--------------------------------

import * as THREE from 'three'
import { OrbitControls } from '/jsm/controls/OrbitControls.js'
import { FBXLoader } from '/jsm/loaders/FBXLoader.js'
import Stats from '/jsm/libs/stats.module.js'

// import Stats from 'stats.js'; // Nếu dùng npm
const progressBarContainer = document.getElementById('progressBarContainer');

// Khởi tạo Stats
const stats = new Stats();
stats.showPanel(0); // Hiển thị tab FPS (0: FPS, 1: ms, 2: mb, 3+: custom)
// Chỉnh sửa CSS của stats.dom để không ảnh hưởng đến các sự kiện chuột

stats.dom.style.left = '500px !important';

stats.dom.style.zIndex = '0';  // Đặt z-index thấp để không chặn sự kiện chuột
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer({ antialias: true });
var controls;
var camera;
const __tube_height = 1918.86;
const tube_offset = 25.5;

var ls_model_finished = undefined;

function init() {
    
    scene.add(new THREE.AxesHelper(5))
    
    // const light = new THREE.PointLight(0xffffff, 1);
    // light.position.set(2000,2000,2000);
    // scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x808080); // Ánh sáng mềm
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xdadada, 1);
    directionalLight.position.set(232, 380, 336); // Vị trí của ánh sáng
    scene.add(directionalLight);

    const w = window.innerWidth;
    const h = window.innerHeight;

    camera = new THREE.PerspectiveCamera(75, w/h , 0.1, 100000);
    
    renderer.setSize(w, h);
    renderer.setClearColor(window.innerWidth <= 820 ? 0xe6e6e6 : 0xd1d2d3); // Thiết lập màu nền xám

    const container = document.getElementById('threejs-container');
    container.appendChild(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = true;
    controls.panSpeed = 1.0;
    controls.minDistance = 0; // Giới hạn zoom gần nhất
    controls.maxDistance = 10000; // Giới hạn zoom xa nhất
    controls.enableDamping = true;

    camera.position.set(window.innerWidth <= 820 ? 800 : 2000, 1500, 8000)
    controls.target.set(window.innerWidth <= 820 ? 800 : 2000, 1500, 0)

    // Xử lý sự kiện touch
    renderer.domElement.addEventListener("touchstart", (event) => {
        if (event.touches.length === 2) {
            // Lưu vị trí ban đầu khi có hai ngón tay chạm
            isPanning = true;
            lastTouchPos = {
                x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
                y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
            };
        }
    });

    renderer.domElement.addEventListener("touchmove", (event) => {
        if (isPanning && event.touches.length === 2) {
            // Tính vị trí hiện tại
            const currentTouchPos = {
                x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
                y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
            };

            // Tính sự thay đổi tọa độ
            const deltaX = currentTouchPos.x - lastTouchPos.x;
            const deltaY = currentTouchPos.y - lastTouchPos.y;

            // Di chuyển camera
            handlePan(deltaX, deltaY);

            // Cập nhật vị trí cuối
            lastTouchPos = currentTouchPos;
        }
    });

    renderer.domElement.addEventListener("touchend", () => {
        isPanning = false;
        lastTouchPos = null;
    });

};

// Biến lưu trạng thái cảm ứng
let isPanning = false;
let lastTouchPos = null;

// Hàm xử lý pan camera
function handlePan(deltaX, deltaY) {
    const panSpeed = 0.01; // Điều chỉnh tốc độ di chuyển
    camera.position.x -= deltaX * panSpeed;
    camera.position.y += deltaY * panSpeed; // Lưu ý: y được đảo vì hệ tọa độ ngược
}

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

    return [p1, p2];
}

export function clearScene(scene) {

    return new Promise((resolve) => {
        function removeObjects() {
            // Lặp qua tất cả các đối tượng trong scene.children
            for (let i = scene.children.length - 1; i >= 0; i--) {
                const object = scene.children[i];

                // Nếu không phải ánh sáng, thực hiện xóa
                if (!object.isLight) {
                    scene.remove(object);

                    // Giải phóng bộ nhớ
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            for (let material of object.material) {
                                material.dispose();
                            }
                        } else {
                            object.material.dispose();
                        }
                    }
                }
            }

            // Kiểm tra nếu chỉ còn ánh sáng trong scene
            if (scene.children.every(child => child.isLight)) {
                resolve(); // Kết thúc nếu tất cả đã được xóa
            } else {
                // Gọi lại hàm removeObjects sau một khoảng thời gian ngắn
                setTimeout(removeObjects, 0);
            }
        }

        removeObjects(); // Gọi hàm lần đầu tiên
    });
}

//------------------------PRELOAD DaarscenedataATA

export function loadDefault() {
    const loader = new FBXLoader();
    const url = ALL_SCENES[0].name;

    loader.load(_fullname(url), function (object) {
            // Add the model to the scene
            scene.add(object);
          }, undefined, function (error) {
            console.error(error);
    });
}

export class PreloadFBXCLS {
    constructor(scenedata) {
        this.enableX = false;
        this.scenedata = scenedata;
        this.localkey = 'aardwolf_3d_data';
        
        this.preloadAllFBX(this.scenedata).then((results) => {
            this.loadedObjects = [];
            this.failedObjects = [];

            results.forEach((result, index) => {
                const sceneobj = this.scenedata[index]; // Lấy dữ liệu cảnh hiện tại

                if (result.status === 'fulfilled') {
                    let obj = result.value.object;
                    obj.name = sceneobj.name;
                    this.loadedObjects.push(obj);
                    console.log(`Loaded: ${obj.name}`);

                    
                    if(index === results.length - 1)
                    {
                        this.enableX = true;
                        progressBarContainer.style.display = 'none';
                    }        
                    //     progressBarContainer.style.display = 'none';
                    // }
                } else {
                    this.failedObjects.push({ id: this.scenedata[index].id, error: result.reason.error });
                    console.error(`Failed to load: ${sceneobj}`);
                }
            });

            

            console.log('Loaded Objects:', this.loadedObjects);
            console.log('Failed Objects:', this.failedObjects);
        })
        .catch((error) => {
            progressBarContainer.style.display = 'none';
            console.error('Unexpected error during preload:', error);
        });
    }

    waitForEnableX = (checkInterval = 100) => {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (this.enableX) {
                    clearInterval(interval);
                    resolve();
                }
            }, checkInterval);
        });
    };

    addToScene(scene, name, pos) {
        if(this.loadedObjects)
        {
            const obj = this.loadedObjects.find(o => o.name === name);
            
            if(obj)
            {
                console.log('Found', obj, name);
                obj.position.set(pos.x, pos.z, pos.y);
                scene.add(obj);
            }else
                console.log('Not found', name);
        }
    }

    preloadFBX(url){
        return new Promise((resolve, reject) => {
            const loader = new FBXLoader();
            loader.load(
                url,
                (object) => resolve({ url, object }), // Trả về URL và đối tượng đã tải
                undefined,                          // Tiến trình tải
                (error) => reject({ url, error })   // Trả về URL và lỗi nếu tải thất bại
            );
        });
    };

    preloadAllFBX() {
        if (window.innerWidth > 820) 
            progressBarContainer.style.display = 'block';
        
        const promises = this.scenedata.map((item) => this.preloadFBX(_fullname(item.name)));
        return Promise.allSettled(promises); // Dùng Promise.allSettled để không bị lỗi nếu 1 file fail
    };
    
}

//------------------------PRELOAD DATA

export async function _load_a_Scene(src_data)
{
    const obj_container = window.preload;
    let [_crane, _pump_group, _tube, _head_stack, _suction_pack] = src_data;
    
    window.SettingObj.priceResult(_crane,  _head_stack, _suction_pack);
    
    await clearScene(scene);
    
    
    const _crane_name = _crane.name;
    
    const [p1, p2] = __extract_point3(_crane_name);
    let tube_height = __tube_height;
       
    console.log('Crane',_crane_name);
    obj_container.addToScene(scene, _crane_name, {x:0, y:0, z:0});
   
    
    if(_tube)
    {
        var pump_z = p1.z;
        if(_crane_name.toLowerCase().includes("mobile")) pump_z += 310;

        // _loadFBX(_pump_group, {x:p1.x, y:0, z:pump_z, rot:0}, onLoadComplete);
        obj_container.addToScene(scene, _pump_group.name, {x:p1.x, y:0, z:pump_z});

        if(_crane.name.toLowerCase().includes('articulated'))
            tube_height -= 300;
        
        // _loadFBX(_tube, {x:p2.x, y:p2.y, z:p2.z, rot:0}, onLoadComplete);
        obj_container.addToScene(scene, _tube.name, {x:p2.x, y:p2.y, z:p2.z});
    

        if(_head_stack && _suction_pack)
        {
            const pad = {x: p2.x - tube_offset, y: p2.y, z:p2.z - tube_height - _head_stack.y};
            obj_container.addToScene(scene, _head_stack.name, pad);
            obj_container.addToScene(scene, _suction_pack.name, pad);

            window.SettingObj.posPad = pad;

            const ext = 1100;
            var mv_x = 0;

            // console.log('pad_y', pad.z);

            window.SettingObj.pdfContent = [{path:_crane.name, x:0 + mv_x, y:0},
                {path:_pump_group.name,x:mv_x + p1.x, y:-p1.z},
                {path:_tube.name,x:mv_x + p2.x, y:-p2.z},
                {path:_head_stack.name,x:mv_x + pad.x, y: - pad.z},
                {path:_suction_pack.name,x:mv_x + pad.x, y: - pad.z}]
        }
    }

    scene.visible = true;
}

document.addEventListener("DOMContentLoaded", function() {
    init();
    // _load_a_Scene();
});

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}
window.addEventListener('resize', onWindowResize, false)
let startPosition;
let endPosition;
let cmr_progress = 0; // Tiến độ chuyển động (từ 0 đến 1)
let duration = 1; // Thời gian chuyển động (giây)
let startTime = null; // Thời gian bắt đầu hiệu ứng chuyển động

// Nội suy tuyến tính
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// Hàm chuyển camera
function moveCamera(timestamp) {
    if (!startTime) startTime = timestamp; // Gán thời gian bắt đầu nếu chưa có
    const elapsedTime = (timestamp - startTime) / 1000; // Thời gian đã trôi qua (giây)

    cmr_progress = Math.min(elapsedTime / duration, 1); // Tiến độ chuyển động (0-1)

    // Tính vị trí camera
    camera.position.x = lerp(startPosition.x, endPosition.x, cmr_progress);
    camera.position.y = lerp(startPosition.y, endPosition.y, cmr_progress);
    camera.position.z = lerp(startPosition.z, endPosition.z, cmr_progress);

    camera.lookAt(0, 0, 0); // Camera luôn nhìn về tâm

    // Tiếp tục nếu chưa hoàn thành
    if (cmr_progress < 1) {
        requestAnimationFrame(moveCamera);
    }
}



// --- CAMERA ---
const clock = new THREE.Clock();

// FPS mong muốn (ví dụ: 30 FPS)
const targetFPS = 30;
const targetDeltaTime = 0.01 / targetFPS;

let lastFrameTime = 0;


// Gán sự kiện cho các góc nhìn
function setView(targetPosition) {
    startPosition = camera.position.clone(); // Sao chép vị trí hiện tại
    endPosition = targetPosition;           // Vị trí mục tiêu
    startTime = null;                        // Đặt lại thời gian bắt đầu
    cmr_progress = 0;                        // Đặt lại tiến độ

    requestAnimationFrame(moveCamera);
}

// Thêm sự kiện cho các góc nhìn
document.getElementById('bottom-view').addEventListener('click', () => setView(new THREE.Vector3(0, -8000, 0)));
document.getElementById('front-view').addEventListener('click', () => setView(new THREE.Vector3(0, 1500, 7000)));
document.getElementById('left-view').addEventListener('click', () => setView(new THREE.Vector3(7000, 1500, 0)));
document.getElementById('right-view').addEventListener('click', () => setView(new THREE.Vector3(-7000, 1500, 0)));
document.getElementById('top-view').addEventListener('click', () => setView(new THREE.Vector3(0, 8000, 0)));
document.getElementById('ortho-view').addEventListener('click', () => setView(new THREE.Vector3(5000, 5000, 5000)));
document.getElementById('360').addEventListener('click', () => setView(new THREE.Vector3(-5000, 5000, -5000)));
// Hàm render
function render() {
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Vòng lặp animation
function animate() {
    const deltaTime = clock.getDelta(); // Thời gian giữa 2 khung hình

    if (controls) {
        controls.update(); // Cập nhật điều khiển nếu có
    }

    render(); // Render lại scene
    requestAnimationFrame(animate); // Lặp vòng
}

animate();


// --- CAMERA ---





// Tạo container hiển thị thông tin
const infoContainer = document.createElement('div');
infoContainer.style.position = 'absolute';
infoContainer.style.top = '100px';
infoContainer.style.left = '100px';
infoContainer.style.color = '#fff';
infoContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
infoContainer.style.padding = '10px';
infoContainer.style.fontFamily = 'monospace';
infoContainer.style.pointerEvents = 'none';
infoContainer.style.zIndex = '99999';
infoContainer.style.display = 'none';
document.body.appendChild(infoContainer);

function countSceneObjects(scene) {
    let geometryCount = 0;
    let lightCount = 0;

    scene.children.forEach((object) => {
        if (object.geometry) {
            geometryCount++;
        }
        if (object.isLight) {
            lightCount++;
        }
    });

    let fbxCount = 0;

    scene.traverse((object) => {
        // Kiểm tra xem object có phải là Mesh hay Group từ FBX
        if (object.isMesh) {
            // Bạn có thể kiểm tra thêm các điều kiện khác để xác định là FBX, ví dụ: thông qua object.name hoặc thuộc tính khác.
            fbxCount++;
        }
    });

    return { geometryCount, lightCount, fbxCount };
}

export function showProgressBar() {
    const progressBarContainer = document.getElementById('progressBarContainer');

    if(progressBarContainer)
        progressBarContainer.style.display = 'block';
}

export function hideProgressBar() {
    const progressBarContainer = document.getElementById('progressBarContainer');

    if(progressBarContainer)
        progressBarContainer.style.display = 'none';
}

export function set_progress_bar(value) {
    progressBar.value = value;  // Giả sử là khi canvas đã được tạo xong

    setTimeout(() => {
        progressBar.dispatchEvent(new Event('input'));
    }, 0);  // 0ms
}
