const ALL_SCENES = ["Mobile Articulated Jib Crane-Two Arm@p1_-87_0_0@p2_2612_0_2405",
"Mobile Over Braced Jib Crane-One Arm@p1_-113_-111_0@p2_3067_-111_3223",
"Over Braced Jib Crane - 3m-125kg@p1_-90_-141_0@p2_2956_-141_3105",
"Over Braced Jib Crane - 4m - 250kg@p1_-100_-166_0@p2_3966_-166_3067",
"Over Braced Jib Crane - 5m - 250kg@p1_-100_-166_0@p2_4966_-166_3067",
"WALL BRACED JIB CRANE 3M 125KG@p1_-200_0_0@p2_3284_0_3029",
"WALL BRACED JIB CRANE 4M 250KG@p1_-200_0_0@p2_4085_0_2748",
"WALL BRACED JIB CRANE 5M 250KG@p1_-200_0_0@p2_5138_0_2748"]


const head_stacks = ["Single control head","High stack","Extra Hand","Comfort control head"]
const suction_packs = ["suction_01","suction_02","suction_03","suction_04","multi_suction_pad"]

// 01: 
// 0

const pump_groups = ["Pump_group_1", "Pump_group_2"];
const small_tube = "TUBE LIFT ID 120";
const big_tube = "TUBE LIFT ID 250";
const tube_height = 1919;
const tube_offset = 25.5;
// In ra mảng data để kiểm tra
console.log(ALL_SCENES);

function select_crane()
{
    let loadType = localStorage.getItem('loadType');
    let jibLength = localStorage.getItem('jibLength');
    let craneType =  localStorage.getItem('craneType');
    let liftTubeSize = localStorage.getItem('liftTubeSize');
    
    // let maxLiftingCapacity = localStorage.getItem('maxLiftingCapacity');
    
    // let liftTubePower = localStorage.getItem('liftTubePower');
    // let priceLiftTubeSize = localStorage.getItem('priceLiftTubeSize');
    // let priceLiftTubePower = localStorage.getItem('priceLiftTubePower');

    let _scenename = "";
    let _pump_group = "";
    let _tube = "";
    let _head_stack = "";
    let _suction_pack = "";

    if(craneType.toLowerCase().includes("wall"))
    {
        if(jibLength <= 3)
            _scenename = ALL_SCENES[5];
        else if(jibLength < 5)
            _scenename = ALL_SCENES[6];
        else
            _scenename = ALL_SCENES[7];
        
        _pump_group = pump_groups[1];
    }
    else 
    {
        if(craneType.toLowerCase().includes("mobile"))
        {
            console.log('Length', jibLength);
            if(jibLength < 3)
                _scenename = ALL_SCENES[0];
            else
                _scenename = ALL_SCENES[1];
        } else 
        {
            if(jibLength <= 3)
                _scenename = ALL_SCENES[2];
            else if(jibLength < 5)
                _scenename = ALL_SCENES[3];
            else
                _scenename = ALL_SCENES[4];
        }

        _pump_group = pump_groups[0];
    }

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

    return [_scenename, _pump_group, _tube, _head_stack, _suction_pack]
}
