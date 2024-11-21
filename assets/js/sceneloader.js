
class SceneLoader {
    constructor(crane_type, jib_length = 0, work_load = 0, load_type = '') {
        this.crane_type = crane_type;
        this.jib_length = jib_length;
        this.work_load = work_load;
        this.load_type = load_type;
    }

    load_Crane() {
        let keywords = [];

        if (this.crane_type.toUpperCase() === "FLOOR") {
            keywords.push('Over Braced Jib');
        } else if (this.crane_type.toUpperCase() === "WALL") {
            keywords.push('WALL BRACED JIB');
        } else if (this.crane_type.toUpperCase() === "MOBILE") {
            if(this.jib_length == 2.5)
                keywords.push('Articulated');
            else
            {
                keywords.push('Mobile');
            }
        }

        if(!keywords.includes('Articulated') && !keywords.includes('Mobile'))
        {
            if(this.jib_length != 0)
                keywords.push(this.jib_length.toString());

            if(this.work_load <= 125)
                keywords.push('125');
            else
                keywords.push('250');
        }
        console.log('keys',keywords.join(','));

        var res = ALL_SCENES.map(scene => scene.name).find(item => 
            keywords.every(keyword => item.toUpperCase().includes(keyword.toUpperCase()))
        );

        if(res)
            return res;
        else
            return undefined;
    }

    load_a_scene() {
        console.log('Scene loaded with crane type:', this.crane_type);
    }
<<<<<<< main
=======
  }

function _load_a_Scene()
{
    
    const radioButtons = document.querySelectorAll('input[type="radio"]');

    // Lọc ra các radio button được chọn (checked)
    const selectedValues = Array.from(radioButtons)
        .filter(radio => radio.checked)
        .map(radio => ({
            name: radio.name, // Lấy thuộc tính name
            value: radio.value // Lấy giá trị được chọn
        }));

    // Hiển thị các radio button được chọn
    // console.log("Các giá trị radio được chọn:", selectedValues);
    
    
    clearScene(scene);
    let ar = select_crane();
    let scenedata = ar[0];

    var ls = __extract_point3(scenedata.name);
    // console.log(ls,_fullname(scenedata.name));

    const p1 = ls[0], p2 = ls[1];

    let tube_height = __tube_height;

    if(scenedata.name.toLowerCase().includes('articulated'))
    {
        tube_height -= 300;
        ar[2] = ar[2].replace(' ID ', ' SM ');
    }
    
    _loadFBX(scenedata.name, {x:0, y:0, z:0, rot:0});
    _loadFBX(ar[1], {x:p1.x, y:0, z:p1.z, rot:0});
    _loadFBX(ar[2], {x:p2.x, y:p2.y, z:p2.z, rot:0});


    var ___ls = ar[3].split('@');
    const pad_name = ___ls[0];
    const firstHElement = ___ls.find(item => item.startsWith('h'));
    const head_h = firstHElement ? parseFloat(firstHElement.slice(1)) : null;

    // console.log('head_h', ar[3], head_h);

    const suction_name = ar[4].split('@')[0];

    

    _loadFBX(pad_name, {x:p2.x - tube_offset, y:p2.y, z:p2.z - tube_height - head_h, rot:0});
    _loadFBX(suction_name, {x:p2.x - tube_offset, y:p2.y, z:p2.z - tube_height - head_h, rot:0});

    mergeSVGs([{path:scenedata.name,x:0,y:0},
        {path:ar[1],x:p1.x, y:-p1.z},
        {path:ar[2],x:p2.x, y:-p2.z},
        {path:pad_name,x:p2.x - tube_offset, y:-p2.z + tube_height + head_h},
        {path:suction_name,x:p2.x - tube_offset, y:-p2.z + tube_height + head_h}], scenedata,
        -3000,-6000,10000,7500);
    
    calc_price(ar);
>>>>>>> local
}



