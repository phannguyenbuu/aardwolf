<<<<<<< HEAD
// Khởi tạo mảng data
const ALL_SCENES = [
    {name: 'Articulated Jib Crane-Two Arm',
    objects: [
        {
            filename: 'Trolley-load-250',
            x: 2400, y: 2147, z: 0, rot: 0, clr: 0x555555, metal: 0.5, rough: 0.8       // Độ nhám
        },
        {
            filename: '#tube',
            x: 2374, y: 1943, z: 0, rot: 0, clr: 0x555555, metal: 0.5, rough: 0.8       // Độ nhám
        }
<<<<<<< main
    ]},

    {name: 'Mobile Articulated Jib Crane-Two Arm',
    objects: [
=======
    }


// 01: 
// 0

const pump_groups = ["Pump_group_1", "Pump_group_2"];
const small_tube = "TUBE LIFT ID 120";
const big_tube = "TUBE LIFT ID 250";
const __tube_height = 1918.86;
const tube_offset = 25.5;
// In ra mảng data để kiểm tra
// console.log(ALL_SCENES);

function select_crane()
{
    let loadType = localStorage.getItem('loadType');
    let jibLength = localStorage.getItem('jibLength');
    let craneType =  localStorage.getItem('craneType');
    let liftTubeSize = localStorage.getItem('liftTubeSize');

    // console.log('load vars',loadType,jibLength,craneType,liftTubeSize)
    
    // let maxLiftingCapacity = localStorage.getItem('maxLiftingCapacity');
    
    // let liftTubePower = localStorage.getItem('liftTubePower');
    // let priceLiftTubeSize = localStorage.getItem('priceLiftTubeSize');
    // let priceLiftTubePower = localStorage.getItem('priceLiftTubePower');

    let _scenedata = undefined;
    let _pump_group = "";
    let _tube = "";
    let _head_stack = "";
    let _suction_pack = "";
    
    if(craneType.toLowerCase().includes("wall"))
    {
        if(jibLength <= 3)
            _scenedata = ALL_SCENES[6];
        else if(jibLength < 5)
            _scenedata = ALL_SCENES[7];
        else
            _scenedata = ALL_SCENES[8];
        
        _pump_group = pump_groups[1];
    }
    else 
    {
        if(craneType.toLowerCase().includes("mobile"))
>>>>>>> local
        {
            filename: 'aardwolf_all_part_Mobile Articulated Jib Crane-Two Arm',
            x: 0, y: 0, z: 0, rot: 45, clr: 0x555555, metal: 0.5, rough: 0.8       // Độ nhám
        },
        {
            filename: 'aardwolf_all_part_Mobile Over Braced Jib Crane-One Arm',
            x: 1000, y: 2500, z: 3500, rot: 90, clr: 0x555555, metal: 0.3, rough: 0.6
        }
    ]},

<<<<<<< main
    {name: 'Mobile Over Braced Jib Crane-One Arm',
    objects: [
        {
            filename: 'aardwolf_all_part_Mobile Articulated Jib Crane-Two Arm',
            x: 0, y: 0, z: 0, rot: 45, clr: 0x555555, metal: 0.5, rough: 0.8       // Độ nhám
        },
        {
            filename: 'aardwolf_all_part_Mobile Over Braced Jib Crane-One Arm',
            x: 1000, y: 2500, z: 3500, rot: 90, clr: 0x555555, metal: 0.3, rough: 0.6
        }
    ]},

    {name: 'Over Braced Jib Crane - 3m - 125kg',
    objects: [
        {
            filename: 'aardwolf_all_part_Mobile Articulated Jib Crane-Two Arm',
            x: 0, y: 0, z: 0, rot: 45, clr: 0x555555, metal: 0.5, rough: 0.8       // Độ nhám
        },
        {
            filename: 'aardwolf_all_part_Mobile Over Braced Jib Crane-One Arm',
            x: 1000, y: 2500, z: 3500, rot: 90, clr: 0x555555, metal: 0.3, rough: 0.6
        }
    ]},

    {name: 'Over Braced Jib Crane - 4m - 250kg',
    objects: [
        {
            filename: 'aardwolf_all_part_Mobile Articulated Jib Crane-Two Arm',
            x: 0, y: 0, z: 0, rot: 45, clr: 0x555555, metal: 0.5, rough: 0.8       // Độ nhám
        },
        {
            filename: 'aardwolf_all_part_Mobile Over Braced Jib Crane-One Arm',
            x: 1000, y: 2500, z: 3500, rot: 90, clr: 0x555555, metal: 0.3, rough: 0.6
        }
    ]},
=======
        _pump_group = pump_groups[0];
    }
    // let _scenename = _scenedata.name;

    _tube = Number(liftTubeSize) <= 120 ? small_tube: big_tube;

    if(loadType.toLowerCase().includes("300max"))
    {
        _head_stack = head_stacks[0];
        _suction_pack = suction_packs[0];
    }
    else if(loadType.toLowerCase().includes("400large"))
    {
        _head_stack = head_stacks[3];
        _suction_pack = suction_packs[2];
    }
    else if(loadType.toLowerCase().includes("bags"))
    {
        _head_stack = head_stacks[3];
        _suction_pack = suction_packs[3];
    }
    else if(loadType.toLowerCase().includes("medium"))
    {
        _head_stack = head_stacks[0];
        _suction_pack = suction_packs[0];
    }
    else if(loadType.toLowerCase().includes("high"))
    {
        _head_stack = head_stacks[1];
        _suction_pack = suction_packs[2];
    }
    else if(loadType.toLowerCase().includes("sheet"))
    {
        _head_stack = head_stacks[2];
        _suction_pack = suction_packs[4];
    }

    return [_scenedata, _pump_group, _tube, _head_stack, _suction_pack]
}

function calc_price(ar)
{
    let loadType = localStorage.getItem('loadType');
    let jibLength = localStorage.getItem('jibLength');
    let craneType =  localStorage.getItem('craneType');
    let liftTubeSize = localStorage.getItem('liftTubeSize');

    const liftTubePower = localStorage.getItem('liftTubePower');
    const maxLiftingCapacity = localStorage.getItem('maxLiftingCapacity');
    const minLiftingCapacity = localStorage.getItem('minLiftingCapacity');

    // console.log('price load vars',loadType,jibLength,craneType,liftTubeSize, liftTubePower,maxLiftingCapacity,minLiftingCapacity)
    // console.log('ar', ar);

    var total = 0;
    var res = `Tube: ${price_list['tube'][liftTubeSize]}+`;
    total += price_list['tube'][liftTubeSize];

    const motor = liftTubePower.split('/').pop().replace('.0','');
    res +=  `Motor: ${price_list['motor'][motor]} + `;
    total += price_list['motor'][motor];

    res +=  `Crane: ${ar[0].price} + `;
    total += ar[0].price;

    res +=  `Filter: ${price_list['filter'][ motor === '8kw' ? "zfp300" : "zfp120" ]}+`;
    total += price_list['filter'][ motor === '8kw' ? "zfp300" : "zfp120" ];

    res += `Power: ${price_list['power']["power_1"]} + `;
    total += price_list['power']["power_1"];

    var ___ls = ar[3].split('@');
    var firstHElement = ___ls.find(item => item.startsWith('p'));
    var price_3 = firstHElement ? parseFloat(firstHElement.slice(1)) : 0;

    res += `Head: ${price_3} + `;
    total += price_3;

    var ___ls = ar[4].split('@');
    var firstHElement = ___ls.find(item => item.startsWith('p'));
    var price_4 = firstHElement ? parseFloat(firstHElement.slice(1)) : 0;

    total += price_4;
    res += `Head: ${price_4}`;

    const savedUsername = localStorage.getItem('username');
    console.log(savedUsername, 'Price:$', total,   res);

    if(savedUsername)
    {
        ['price','totalPrice','totalPrice2'].foprEach(_k => {
            var price_obj = document.getElementById(_k);
            if(price_obj)
                price_obj.innerHTML = '$' + total.toLocaleString();
        });
    }
>>>>>>> local

    {name: 'Over Braced Jib Crane - 5m - 250kg',
    objects: [
        {
            filename: 'aardwolf_all_part_Mobile Articulated Jib Crane-Two Arm',
            x: 0, y: 0, z: 0, rot: 45, clr: 0x555555, metal: 0.5, rough: 0.8       // Độ nhám
        },
        {
            filename: 'aardwolf_all_part_Mobile Over Braced Jib Crane-One Arm',
            x: 1000, y: 2500, z: 3500, rot: 90, clr: 0x555555, metal: 0.3, rough: 0.6
        }
    ]},

    {name: 'WALL BRACED JIB CRANE 3M 125KG',
    objects: [
        {
            filename: 'aardwolf_all_part_Mobile Articulated Jib Crane-Two Arm',
            x: 0, y: 0, z: 0, rot: 45, clr: 0x555555, metal: 0.5, rough: 0.8       // Độ nhám
        },
        {
            filename: 'aardwolf_all_part_Mobile Over Braced Jib Crane-One Arm',
            x: 1000, y: 2500, z: 3500, rot: 90, clr: 0x555555, metal: 0.3, rough: 0.6
        }
    ]},

    {name: 'WALL BRACED JIB CRANE 4M 250KG',
    objects: [
        {
            filename: 'aardwolf_all_part_Mobile Articulated Jib Crane-Two Arm',
            x: 0, y: 0, z: 0, rot: 45, clr: 0x555555, metal: 0.5, rough: 0.8       // Độ nhám
        },
        {
            filename: 'aardwolf_all_part_Mobile Over Braced Jib Crane-One Arm',
            x: 1000, y: 2500, z: 3500, rot: 90, clr: 0x555555, metal: 0.3, rough: 0.6
        }
    ]},

    {name: 'WALL BRACED JIB CRANE 5M 250KG',
    objects: [
        {
            filename: 'aardwolf_all_part_Mobile Articulated Jib Crane-Two Arm',
            x: 0, y: 0, z: 0, rot: 45, clr: 0x555555, metal: 0.5, rough: 0.8       // Độ nhám
        },
        {
            filename: 'aardwolf_all_part_Mobile Over Braced Jib Crane-One Arm',
            x: 1000, y: 2500, z: 3500, rot: 90, clr: 0x555555, metal: 0.3, rough: 0.6
        }
    ]},
];
=======
const ALL_SCENES = [{name: "Mobile Articulated Jib Crane-Two Arm@p1_-87_0_0@p2_2612_0_2405",
    dx: [210,1343,1088], dy: [2552,2607,2398]},
{name: "Mobile Over Braced Jib Crane-One Arm@p1_-113_-111_0@p2_3067_-111_3378",
    dx: [140,2699,355], dy: [4041,4101,3431]},
{name: "Over Braced Jib Crane - 3m-125kg@p1_-90_-141_0@p2_2956_-141_3105",
    dx: [140,2699,355], dy: [3782,3841,3171]},
{name: "Over Braced Jib Crane - 4m - 250kg@p1_-100_-166_0@p2_3966_-166_3067",
    dx: [178,2096,1955], dy: [3980,4045,3110]},
{name: "Over Braced Jib Crane - 5m - 250kg@p1_-100_-166_0@p2_4966_-166_3067",
    dx: [178,2585,2452], dy: [3980,4045,3110]},
{name: "WALL BRACED JIB CRANE 3M 125KG@p1_-200_0_0@p2_3284_0_3029",
    dx: [470,2699,355], dy: [3685,3860,3073]},
{name: "WALL BRACED JIB CRANE 4M 250KG@p1_-200_0_0@p2_4085_0_2748",
    dx: [459,2096,1955], dy: [3685,3860,2815]},
{name: "WALL BRACED JIB CRANE 5M 250KG@p1_-200_0_0@p2_5138_0_2748",
    dx: [472,2585,2452], dy: [3685,3860,2815]}
]


const head_stacks = ["Single control head_@h342","High stack_@h247","Extra Hand_@h247","Comfort control head_@h190"]
const suction_packs = ["suction_01","suction_02","suction_03","suction_04","multi_suction_pad"]

// 01: 
// 0
>>>>>>> 7309194779d6eca56d5682159270d75692cc65da

const pump_groups = ["Pump_group_1", "Pump_group_2"];
const small_tube = "TUBE LIFT ID 120";
const big_tube = "TUBE LIFT ID 250";
const tube_height = 1918.86;
const tube_offset = 25.5;
// In ra mảng data để kiểm tra
console.log(ALL_SCENES);

function select_crane()
{
    let loadType = localStorage.getItem('loadType');
    let jibLength = localStorage.getItem('jibLength');
    let craneType =  localStorage.getItem('craneType');
    let liftTubeSize = localStorage.getItem('liftTubeSize');

    console.log('load vars',loadType,jibLength,craneType,liftTubeSize)
    
    // let maxLiftingCapacity = localStorage.getItem('maxLiftingCapacity');
    
    // let liftTubePower = localStorage.getItem('liftTubePower');
    // let priceLiftTubeSize = localStorage.getItem('priceLiftTubeSize');
    // let priceLiftTubePower = localStorage.getItem('priceLiftTubePower');

    let _scenedata = undefined;
    let _pump_group = "";
    let _tube = "";
    let _head_stack = "";
    let _suction_pack = "";

    if(craneType.toLowerCase().includes("wall"))
    {
        if(jibLength <= 3)
            _scenedata = ALL_SCENES[5];
        else if(jibLength < 5)
            _scenedata = ALL_SCENES[6];
        else
            _scenedata = ALL_SCENES[7];
        
        _pump_group = pump_groups[1];
    }
    else 
    {
        if(craneType.toLowerCase().includes("mobile"))
        {
            console.log('Length', jibLength);
            if(jibLength < 3)
                _scenedata = ALL_SCENES[0];
            else
                _scenedata = ALL_SCENES[1];
        } else 
        {
            if(jibLength <= 3)
                _scenedata = ALL_SCENES[2];
            else if(jibLength < 5)
                _scenedata = ALL_SCENES[3];
            else
                _scenedata = ALL_SCENES[4];
        }

        _pump_group = pump_groups[0];
    }
    // let _scenename = _scenedata.name;

    _tube = Number(liftTubeSize) <= 120 ? small_tube: big_tube;

    if(loadType.toLowerCase().includes("300max"))
    {
        _head_stack = head_stacks[0];
        _suction_pack = suction_packs[0];
    }
    else if(loadType.toLowerCase().includes("400large"))
    {
        _head_stack = head_stacks[3];
        _suction_pack = suction_packs[2];
    }
    else if(loadType.toLowerCase().includes("bags"))
    {
        _head_stack = head_stacks[3];
        _suction_pack = suction_packs[3];
    }
    else if(loadType.toLowerCase().includes("medium"))
    {
        _head_stack = head_stacks[0];
        _suction_pack = suction_packs[0];
    }
    else if(loadType.toLowerCase().includes("high"))
    {
        _head_stack = head_stacks[1];
        _suction_pack = suction_packs[2];
    }
    else if(loadType.toLowerCase().includes("sheet"))
    {
        _head_stack = head_stacks[2];
        _suction_pack = suction_packs[4];
    }

    return [_scenedata, _pump_group, _tube, _head_stack, _suction_pack]
}
