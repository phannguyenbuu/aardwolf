// ----------------------------Bắt đầu 3D--------------------------------

import * as THREE from 'three'
import { OrbitControls } from '/jsm/controls/OrbitControls.js'
import { FBXLoader } from '/jsm/loaders/FBXLoader.js'
import Stats from '/jsm/libs/stats.module.js'

const scene = new THREE.Scene();
var controls;
var renderer;
var camera;
var dim_txt_size = '200';

function _loadFBX(scenedata, o) {
    const filename = _fullname(scenedata)
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true,
        opacity: 0.05,          // Độ mờ (từ 0.0 đến 1.0, với 0 là hoàn toàn trong suốt và 1 là không trong suốt)
        transparent: true 
      });
    const fbxLoader = new FBXLoader();

    fbxLoader.load(
        filename,
        (object) => {
            object.traverse(function (child) {
                if (child.isMesh) {
                    
                }
            })
            object.position.set(o.x, o.z, o.y)
            object.rotation.y = Math.PI / 180 * o.rot;

            const objectCopy = object.clone(); // Tạo bản sao của object

            objectCopy.traverse(function(child) {
                if (child.isMesh) {
                    child.material = wireframeMaterial; // Thay đổi vật liệu của mesh con
                }
            });
            // Thay đổi vị trí hoặc các thuộc tính của bản sao nếu cần
            // objectCopy.position.set(o.x + 10, o.z, o.y); // Ví dụ: di chuyển bản sao một chút

            // Thêm cả object và objectCopy vào scene
            scene.add(object);      // Thêm đối tượng gốc vào scene
            scene.add(objectCopy);  // Thêm bản sao vào scene

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

async function mergeSVGs(files, scenedata) {
    const parser = new DOMParser();
    const mergedSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    mergedSVG.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    mergedSVG.setAttribute("version", "1.1");

    for (let file of files) {
        const response = await fetch('models/svg/' + file.path + '.svg');
        console.log('models/svg/' + file.path + '.svg');

        const svgText = await response.text();
        const lines = svgText.split('\n');

        // Duyệt qua từng dòng trong SVG
        let valid_content = '';

        lines.forEach(line => {if (line.includes('<polyline') || line.includes('svg')) valid_content += line + "\n"});


        const parser = new DOMParser();
        const svgDocument = parser.parseFromString(valid_content, 'image/svg+xml');
        // console.log(svgDocument);

        // Lấy tất cả các phần tử <polyline>
        const polylineElements = svgDocument.querySelectorAll('polyline');

        // Tạo nhóm <g> để di chuyển SVG
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("transform", `translate(${file.x}, ${file.y})`);

        // Duyệt qua tất cả các phần tử <polyline> và thêm chúng vào nhóm <g>
        polylineElements.forEach(polyline => {
            // console.log(polyline);  // In ra phần tử <polyline>
            // console.log(polyline.getAttribute('points'));  // In ra thuộc tính 'points' của <polyline>

            // Tạo một bản sao của polyline và thêm vào nhóm <g>
            const polylineClone = polyline.cloneNode(true);
            group.appendChild(polylineClone);  // Thêm phần tử <polyline> vào nhóm <g>
        });

        // Nếu bạn muốn thêm nhóm <g> vào tài liệu SVG hiện tại
        // svgDocument.documentElement.appendChild(group);

        // Kiểm tra lại toàn bộ nội dung SVG sau khi thêm nhóm <g>
        // console.log(svgDocument.documentElement.outerHTML);


        // Thêm vào SVG tổng hợp
        mergedSVG.appendChild(group);
    }

    mergedSVG.setAttribute("viewBox", `${-2000} ${-5500} ${8000} ${6000}`);

    let dy = -scenedata.dy[1] - 300;
    drawDimension(mergedSVG, { x: scenedata.dx[0], y: dy}, { x: scenedata.dx[0] + scenedata.dx[1], y: dy }, 200); // Ngang
    drawDimension(mergedSVG, { x:  scenedata.dx[0] + scenedata.dx[1], y: dy}, { x:  scenedata.dx[0] + scenedata.dx[1] + scenedata.dx[2], y: dy }, 200); // Ngang

    drawVerticalDimension(mergedSVG, { x: 1200, y: 0}, { x: 1200, y: -286 }, 200); // Ngang
    drawVerticalDimension(mergedSVG, { x: 1700, y: 0}, { x: 1700, y: -942 }, 200); // Ngang
    drawVerticalDimension(mergedSVG, { x: -700, y: 0}, { x: - 700, y: -1400 }, 200); // Ngang
    drawVerticalDimension(mergedSVG, { x: -1200, y: 0}, { x: - 1200, y: -scenedata.dy[0] }, 200); // Ngang
    drawVerticalDimension(mergedSVG, { x:- 1700, y: 0}, { x: - 1700, y: -scenedata.dy[1] }, 200); // Ngang
    drawVerticalDimension(mergedSVG, { x:scenedata.dx[0] + scenedata.dx[1] + scenedata.dx[2] + 500, y: 0}, { x: scenedata.dx[0] + scenedata.dx[1] + scenedata.dx[2] + 500, y: -33 }, 200); // Ngang
    drawVerticalDimension(mergedSVG, { x:scenedata.dx[0] + scenedata.dx[1] + scenedata.dx[2] + 1200, y: 0}, { x: scenedata.dx[0] + scenedata.dx[1] + scenedata.dx[2] + 1200, y: -scenedata.dy[2] }, 200); // Ngang

    var canvas_pdf = document.getElementById('pdf-2d');
    console.log('canvas_pdf', canvas_pdf);

    if(canvas_pdf)
    {
        canvas_pdf.innerHTML = '';
        // Hiển thị hoặc xuất SVG gộp
        canvas_pdf.appendChild(mergedSVG);
        // console.log(new XMLSerializer().serializeToString(mergedSVG)); // In nội dung SVG
    }
<<<<<<< HEAD
<<<<<<< main
=======
=======
>>>>>>> 7309194779d6eca56d5682159270d75692cc65da
  }

function _load_a_Scene()
{
<<<<<<< HEAD
    
=======
>>>>>>> 7309194779d6eca56d5682159270d75692cc65da
    const radioButtons = document.querySelectorAll('input[type="radio"]');

    // Lọc ra các radio button được chọn (checked)
    const selectedValues = Array.from(radioButtons)
        .filter(radio => radio.checked)
        .map(radio => ({
            name: radio.name, // Lấy thuộc tính name
            value: radio.value // Lấy giá trị được chọn
        }));

    // Hiển thị các radio button được chọn
<<<<<<< HEAD
    // console.log("Các giá trị radio được chọn:", selectedValues);
=======
    console.log("Các giá trị radio được chọn:", selectedValues);
>>>>>>> 7309194779d6eca56d5682159270d75692cc65da
    
    
    clearScene(scene);
    let ar = select_crane();
    let scenedata = ar[0];

    var ls = __extract_point3(scenedata.name);
<<<<<<< HEAD
    // console.log(ls,_fullname(scenedata.name));

    const p1 = ls[0], p2 = ls[1];

    let tube_height = __tube_height;

    if(scenedata.name.toLowerCase().includes('articulated'))
    {
        tube_height -= 300;
        ar[2] = ar[2].replace(' ID ', ' SM ');
    }
=======
    console.log(ls,_fullname(scenedata.name));

    const p1 = ls[0], p2 = ls[1];
>>>>>>> 7309194779d6eca56d5682159270d75692cc65da
    
    _loadFBX(scenedata.name, {x:0, y:0, z:0, rot:0});
    _loadFBX(ar[1], {x:p1.x, y:0, z:p1.z, rot:0});
    _loadFBX(ar[2], {x:p2.x, y:p2.y, z:p2.z, rot:0});


<<<<<<< HEAD
    var ___ls = ar[3].split('@');
    const pad_name = ___ls[0];
    const firstHElement = ___ls.find(item => item.startsWith('h'));
    const head_h = firstHElement ? parseFloat(firstHElement.slice(1)) : null;

    // console.log('head_h', ar[3], head_h);

    const suction_name = ar[4].split('@')[0];

    

    _loadFBX(pad_name, {x:p2.x - tube_offset, y:p2.y, z:p2.z - tube_height - head_h, rot:0});
    _loadFBX(suction_name, {x:p2.x - tube_offset, y:p2.y, z:p2.z - tube_height - head_h, rot:0});
=======
    const ___ls = ar[3].split('@');

    const firstHElement = ___ls.find(item => item.startsWith('h'));
    const head_h = firstHElement ? parseFloat(firstHElement.slice(1)) : null;

    console.log('head_h', ar[3], head_h);

    _loadFBX(ar[3], {x:p2.x - tube_offset, y:p2.y, z:p2.z - tube_height - head_h, rot:0});
    _loadFBX(ar[4], {x:p2.x - tube_offset, y:p2.y, z:p2.z - tube_height - head_h, rot:0});
>>>>>>> 7309194779d6eca56d5682159270d75692cc65da

    mergeSVGs([{path:scenedata.name,x:0,y:0},
        {path:ar[1],x:p1.x, y:-p1.z},
        {path:ar[2],x:p2.x, y:-p2.z},
<<<<<<< HEAD
        {path:pad_name,x:p2.x - tube_offset, y:-p2.z + tube_height + head_h},
        {path:suction_name,x:p2.x - tube_offset, y:-p2.z + tube_height + head_h}], scenedata,
        -3000,-6000,10000,7500);
    
    calc_price(ar);
>>>>>>> local
=======
        {path:ar[3],x:p2.x - tube_offset, y:-p2.z + tube_height + head_h},
        {path:ar[4],x:p2.x - tube_offset, y:-p2.z + tube_height + head_h}], scenedata);
    
    // drawDimension(svg, { x: 50, y: 100 }, { x: 300, y: 100 }, 30); // Ngang
    // drawDimension(svg, { x: 400, y: 50 }, { x: 400, y: 200 }, 30); // Dọc
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
>>>>>>> 7309194779d6eca56d5682159270d75692cc65da
}



function drawVerticalDimension(svg, p1, p2, h) {
    const xmlns = "http://www.w3.org/2000/svg";

    // Tính toán độ dài
    const dy = Math.abs(p2.y - p1.y);
    const length = dy;

    // Định nghĩa nhóm SVG
    const group = document.createElementNS(xmlns, "g");

    const defs = document.createElementNS(xmlns, "defs");

    // Marker bắt đầu
    const markerStart = document.createElementNS(xmlns, "marker");
    markerStart.setAttribute("id", "arrow-start");
    markerStart.setAttribute("markerWidth", "10");
    markerStart.setAttribute("markerHeight", "10");
    markerStart.setAttribute("refX", "10");
    markerStart.setAttribute("refY", "5");
    markerStart.setAttribute("orient", "auto");
    const pathStart = document.createElementNS(xmlns, "path");
    pathStart.setAttribute("d", "M 0 0 L 10 5 L 0 10 Z");
    pathStart.setAttribute("fill", "black");
    markerStart.appendChild(pathStart);
    defs.appendChild(markerStart);

    // Marker kết thúc
    const markerEnd = document.createElementNS(xmlns, "marker");
    markerEnd.setAttribute("id", "arrow-end");
    markerEnd.setAttribute("markerWidth", "10");
    markerEnd.setAttribute("markerHeight", "10");
    markerEnd.setAttribute("refX", "10");
    markerEnd.setAttribute("refY", "5");
    markerEnd.setAttribute("orient", "auto-start-reverse");
    const pathEnd = document.createElementNS(xmlns, "path");
    pathEnd.setAttribute("d", "M 0 0 L 10 5 L 0 10 Z");
    pathEnd.setAttribute("fill", "black");
    markerEnd.appendChild(pathEnd);
    defs.appendChild(markerEnd);

    svg.appendChild(defs);

    // Đường chính (line p1 -> p2)
    const mainLine = document.createElementNS(xmlns, "line");
    mainLine.setAttribute("x1", p1.x);
    mainLine.setAttribute("y1", p1.y);
    mainLine.setAttribute("x2", p2.x);
    mainLine.setAttribute("y2", p2.y);
    mainLine.setAttribute("stroke", "black");
    mainLine.setAttribute("stroke-width", "5");
    mainLine.setAttribute("marker-start", "url(#arrow-end)");
    mainLine.setAttribute("marker-end", "url(#arrow-start)");

    // Đường phụ ngang tại p1
    const perpLine1 = document.createElementNS(xmlns, "line");
    perpLine1.setAttribute("x1", p1.x - h);
    perpLine1.setAttribute("y1", p1.y);
    perpLine1.setAttribute("x2", p1.x + h);
    perpLine1.setAttribute("y2", p1.y);
    perpLine1.setAttribute("stroke", "black");
    perpLine1.setAttribute("stroke-width", "5");

    // Đường phụ ngang tại p2
    const perpLine2 = document.createElementNS(xmlns, "line");
    perpLine2.setAttribute("x1", p2.x - h);
    perpLine2.setAttribute("y1", p2.y);
    perpLine2.setAttribute("x2", p2.x + h);
    perpLine2.setAttribute("y2", p2.y);
    perpLine2.setAttribute("stroke", "black");
    perpLine2.setAttribute("stroke-width", "5");

    // Văn bản kích thước
    const text = document.createElementNS(xmlns, "text");
    const textX = p1.x - 50; // Tọa độ X của văn bản
    const textY = (p1.y + p2.y) / 2; // Tọa độ Y của văn bản
    text.setAttribute("x", textX);
    text.setAttribute("y", textY);
    text.setAttribute("font-size", dim_txt_size);
    text.setAttribute("fill", "black");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("transform", `rotate(-90, ${textX}, ${textY})`); // Xoay 90 độ
    text.textContent = `${Math.round(length)}`;

    // Thêm vào nhóm
    group.appendChild(mainLine);
    group.appendChild(perpLine1);
    group.appendChild(perpLine2);
    group.appendChild(text);

    // Thêm vào SVG
    svg.appendChild(group);
}




function drawDimension(svg, p1, p2, h) {
    const xmlns = "http://www.w3.org/2000/svg";

    // Tính toán vector
    const isHorizontal = p1.y === p2.y; // Kiểm tra nếu là đường ngang
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Tọa độ văn bản
    const textX = (p1.x + p2.x) / 2;
    const textY = p1.y - 50;

    // Định nghĩa nhóm SVG
    const group = document.createElementNS(xmlns, "g");

    const defs = document.createElementNS(xmlns, "defs");

    const markerStart = document.createElementNS(xmlns, "marker");
    markerStart.setAttribute("id", "arrow-start");
    markerStart.setAttribute("markerWidth", "10");
    markerStart.setAttribute("markerHeight", "10");
    markerStart.setAttribute("refX", "10"); // Di chuyển marker-start
    markerStart.setAttribute("refY", "5");
    markerStart.setAttribute("orient", "auto"); // Hướng tự động
    const pathStart = document.createElementNS(xmlns, "path");
    pathStart.setAttribute("d", "M 0 0 L 10 5 L 0 10 Z");
    pathStart.setAttribute("fill", "black"); // Màu marker bắt đầu
    markerStart.appendChild(pathStart);
    defs.appendChild(markerStart);

    // Định nghĩa marker cho cuối (marker-end)
    const markerEnd = document.createElementNS(xmlns, "marker");
    markerEnd.setAttribute("id", "arrow-end");
    markerEnd.setAttribute("markerWidth", "10");
    markerEnd.setAttribute("markerHeight", "10");
    markerEnd.setAttribute("refX", "10"); // Di chuyển marker-end
    markerEnd.setAttribute("refY", "5");
    markerEnd.setAttribute("orient", "auto-start-reverse"); // Hướng ngược lại
    const pathEnd = document.createElementNS(xmlns, "path");
    pathEnd.setAttribute("d", "M 0 0 L 10 5 L 0 10 Z");
    pathEnd.setAttribute("fill", "black"); // Màu marker kết thúc
    markerEnd.appendChild(pathEnd);
    defs.appendChild(markerEnd);

    svg.appendChild(defs);


    // Đường chính (line p1 -> p2)
    const mainLine = document.createElementNS(xmlns, "line");
    mainLine.setAttribute("x1", p1.x);
    mainLine.setAttribute("y1", p1.y);
    mainLine.setAttribute("x2", p2.x);
    mainLine.setAttribute("y2", p2.y);
    mainLine.setAttribute("stroke", "black");
    mainLine.setAttribute("stroke-width", "5");
    mainLine.setAttribute("marker-end", "url(#arrow-start)");
    mainLine.setAttribute("marker-start", "url(#arrow-end)");

    svg.appendChild(defs);

    // Đường phụ vuông góc tại p1
    const perpLine1 = document.createElementNS(xmlns, "line");
    perpLine1.setAttribute("x1", p1.x);
    perpLine1.setAttribute("y1", p1.y - h);
    perpLine1.setAttribute("x2", p1.x);
    perpLine1.setAttribute("y2", p1.y + h);
    perpLine1.setAttribute("stroke", "black");
    perpLine1.setAttribute("stroke-width", "5");

    // Đường phụ vuông góc tại p2
    const perpLine2 = document.createElementNS(xmlns, "line");
    perpLine2.setAttribute("x1", p2.x);
    perpLine2.setAttribute("y1", p2.y - h);
    perpLine2.setAttribute("x2", p2.x);
    perpLine2.setAttribute("y2", p2.y + h);
    perpLine2.setAttribute("stroke", "black");
    perpLine2.setAttribute("stroke-width", "5");

    // Văn bản kích thước
    const text = document.createElementNS(xmlns, "text");
    text.setAttribute("x", textX);
    text.setAttribute("y", textY - 5);
    text.setAttribute("font-size", dim_txt_size);
    text.setAttribute("fill", "black");
    text.setAttribute("text-anchor", "middle");
    text.textContent = `${Math.round(length)}`;

    // Thêm vào nhóm
    group.appendChild(mainLine);
    group.appendChild(perpLine1);
    group.appendChild(perpLine2);
    group.appendChild(text);

    // Thêm vào SVG
    svg.appendChild(group);
}



// Đảm bảo mọi radio sẽ được xử lý
handleRadioChange('craneType', (radio) => radio.id);
handleRadioChange('jibLength', (radio) => {
    const numbers = radio.id.match(/\d+/g); 
    return numbers ? numbers.map(Number)[0] : null; 
});
handleRadioChange('loadType', (radio) => radio.id);
handleRadioChange('workLoadLimit', () => {
    
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
