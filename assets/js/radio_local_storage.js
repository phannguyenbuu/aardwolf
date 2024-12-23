// import { _load_a_Scene } from './sceneloader.js';

const kgToLbs = (kg) => (kg * 2.20462).toFixed(0); // Chuyển từ kg sang lbs
const mToInch = (m) => m * 39.3701; // Chuyển từ mét sang inch (không làm tròn ở đây)
const mmToInch = (mm) => mm / 25.4; // Chuyển từ mm sang inch (không làm tròn ở đây)

// Hàm chuyển đổi inch sang định dạng feet'inch"
const inchToFeetInch = (inches) => {
    const feet = Math.floor(inches / 12); // Lấy phần nguyên là feet
    const inch = Math.round(inches % 12); // Lấy phần dư và làm tròn inch
    return feet != 0 ? `${feet}'${inch}"` : `${inch}"`;
};

function generateInchData(data) {
    const convertedData = {};

    Object.keys(data).forEach((key) => {
        const metricData = data[key].m;

        const inchData = {
            maxLiftingCapacity: `${kgToLbs(parseFloat(metricData.maxLiftingCapacity.split(' ')[0]))} lbs`,
            minLiftingCapacity: `${kgToLbs(parseFloat(metricData.minLiftingCapacity))}`,
            liftTube17: inchToFeetInch(mToInch(parseFloat(metricData.liftTube17.split(' ')[0]))),
            liftTube29: inchToFeetInch(mToInch(parseFloat(metricData.liftTube29.split(' ')[0]))),
            liftTubeSize: `${inchToFeetInch(mmToInch(parseFloat(metricData.liftTubeSize.split(' ')[0])))}`,
            liftTubePower: metricData.liftTubePower,
            priceLiftTubeSize: metricData.priceLiftTubeSize,
            priceLiftTubePower: metricData.priceLiftTubePower,
        };

        convertedData[key] = {
            ...data[key],
            Inch: inchData,
        };
    });

    return convertedData;
}

function parseFeetAndInches(input) {
    const regex = /(\d+)'(\d+)"/; // Biểu thức chính quy để tách feet và inches
    const regexInchesOnly = /(\d+)"/; // Biểu thức chính quy để tách chỉ có inches

    let match = input.match(regex);

    if (match) {
        const feet = parseInt(match[1], 10); // Lấy giá trị feet
        const inches = parseInt(match[2], 10); // Lấy giá trị inches

        // Tổng chiều dài chỉ tính bằng inches
        let res = Math.round((feet * 12 + inches) * 25.4 / 10) * 10;
        if (res === 150) res = 160; // Nếu kết quả là 150, thay đổi thành 160

        return res;
    }

    // Trường hợp chỉ có inches
    match = input.match(regexInchesOnly);

    if (match) {
        const inches = parseInt(match[1], 10); // Lấy giá trị inches

        // Chuyển đổi chỉ có inches sang chiều dài bằng mm (1 inch = 25.4mm)
        let res = Math.round(inches * 25.4 / 10) * 10;
        if (res === 150) res = 160; // Nếu kết quả là 150, thay đổi thành 160

        return res;
    }

    return null; // Nếu không khớp với bất kỳ biểu thức nào
}


WORKLOAD_DATA = {
    '45kg': {
        m: { 
            maxLiftingCapacity: '45 kg', 
            minLiftingCapacity: '10', 
            liftTube17: '1.7 m', 
            liftTube29: '2.9 m', 
            liftTubeSize: '160 mm', 
            liftTubePower: '3.3/3.8 kw', 
            priceLiftTubeSize: 356,
            priceLiftTubePower: 2.743 
        }
    },
    '70kg': {

        m: { 
            maxLiftingCapacity: '70 kg', 
            minLiftingCapacity: '10', 
            liftTube17: '1.7 m', 
            liftTube29: '2.9 m', 
            liftTubeSize: '160 mm', 
            liftTubePower: '4.0/4.6 kw', 
            priceLiftTubeSize: 356, 
            priceLiftTubePower: 3.424 
        }
    },
    '80kg': {

        m: { 
            maxLiftingCapacity: '80 kg',
            minLiftingCapacity: '10', 
            liftTube17: '1.7 m', 
            liftTube29: '2.9 m', 
            liftTubeSize: '180 mm', 
            liftTubePower: '4.0/4.6 kw',
            priceLiftTubeSize: 469, 
            priceLiftTubePower: 3.424 
        }
    },
    '120kg': {
        
        m: { 
            maxLiftingCapacity: '120 kg', 
            minLiftingCapacity: '10', 
            liftTube17: '1.7 m', 
            liftTube29: '2.9 m', 
            liftTubeSize: '200 mm', 
            liftTubePower: '5.7/6.6 kw', 
            priceLiftTubeSize: 328, 
            priceLiftTubePower: 3.857 
        }
    },
    '150kg': {

        m: { 
            maxLiftingCapacity: '150 kg', 
            minLiftingCapacity: '10', 
            liftTube17: '1.7 m', 
            liftTube29: '2.9 m', 
            liftTubeSize: '250 mm', 
            liftTubePower: '7.5/8.0 kw', 
            priceLiftTubeSize: 376, 
            priceLiftTubePower: 5.033 
        }
    }
};

WORKLOAD_DATA = generateInchData(WORKLOAD_DATA);

const ALL_SCENES = [
    {   key:'mobile_articulated_crane',
        name: "Mobile Articulated Jib Crane-Two Arm@p1_-87_0_0@p2_2612_0_2405",
        dx: [210,1400,1100], vy: [2730, 2500], dy: [2550, 2400]},
    
    {   key:'mobile_crane_250',
        name: "Mobile Over Braced Jib Crane-One Arm@p1_-113_-111_0@p2_3067_-111_3378",
        dx: [140,3000, 0], vy: [3500, 2500], dy:[4100, 3430]},
    
    {   key:'floor_articulated_crane',
        name: "Articulated Jib Crane-Two Arm@p1_-87_0_0@p2_2612_0_2119",
        dx: [210,1345,1090], vx: [0,1650,1350], vy: [3450,3200], dy:[2270, 2110]},
    
    {   key:'floor_jib_crane_250_3m',
        name: "Over Braced Jib Crane - 3m-125kg@p1_-90_-141_0@p2_2956_-141_3105",
        dx: [140,3000,0], vy: [4200,3200], dy:[3840, 3170]},
    
    {
        key:'floor_jib_crane_250_4m',
        name: "Over Braced Jib Crane - 4m - 250kg@p1_-100_-166_0@p2_3966_-166_3067",
        dx: [178,4000,0], vy: [4200,3200], dy:[4050, 3120]},
    
    {   
        key:'floor_jib_crane_250_5m',
        name: "Over Braced Jib Crane - 5m - 250kg@p1_-100_-166_0@p2_4966_-166_3067",
        dx: [178,5000,0], vy: [4200,3200], dy:[4050, 3120]},
    
    {
        key:'wall_mounted_jib_crane_250_3m',
        name: "WALL BRACED JIB CRANE 3M 125KG@p1_-200_0_0@p2_3284_0_3029",
        dx: [470,3000,0], vy: [4200,3200], dy:[4050, 3070]},
    
    {
        key:'wall_mounted_jib_crane_250_4m',
        name: "WALL BRACED JIB CRANE 4M 250KG@p1_-200_0_0@p2_4085_0_2748",
        dx: [459,4000,0], vy: [4200,3200], dy:[4000, 2820]},
    
    {   
        key:'wall_mounted_jib_crane_250_5m',
        name: "WALL BRACED JIB CRANE 5M 250KG@p1_-200_0_0@p2_5138_0_2748",
        dx: [472,5000,0], vy: [4200,3200], dy:[4000, 2820]}
];

const HEAD_STACKS = [
    {key: 'single_control_head', name: "Single control head", y: 342},
    {key: 'hight_stack', name: "High stack", y: 247},
    {key: 'extra_hand', name: "Extra Hand", y: 247},
    {key: 'comfort_control_head', name:"Comfort control head", y: 190}];

const SUCTION_PACKS = [
    {key: 'bellow_250', name:"suction_01"},
    {key: 'double_bellow_125', name: "suction_02"},
    {key: 'four_bellow_125', name: "suction_03"},
    {key: 'oval_foam_suction_380_220', name: "suction_04"},
    {key: 'sheet_metal_pad', name: "multi_suction_pad"}];

const PUMP_GROUPS = [{name:"Pump_group_1"}, {name:"Pump_group_2"}];
const small_tube = {name:"TUBE LIFT ID 120"};
const big_tube = {name:"TUBE LIFT ID 250"};
const small_sm_tube = {name:"TUBE LIFT SM 120"};
const big_sm_tube = {name:"TUBE LIFT SM 250"};



class AVSettingData {
    constructor() {
        this.fromBack = false;
        this.pdfContent = null;
        this.outputFile = null;

        this.loadType = null;
        this.craneType = 'floor-mounted-crane';
        this.jibLength = '2.5m';
        this.workLoadLimit = null;
        this.userName = null;

        this.selectedUnit = 'm';
        // this.priceLiftTubeSize = null;
        // this.priceLiftTubePower = null;

        this.totalPrice = 0;
        this.sceneData = null;
    }

    saveLocalStorage() {
        this.readUI();
        // console.log('save json',JSON.stringify(this));
        localStorage.setItem("AarwolfVacumn", JSON.stringify(this));
    }

    loadFromLocalStorage() {
        const data = JSON.parse(localStorage.getItem("AarwolfVacumn"));

        if (data) {
            Object.assign(this, data);
            console.log('load json', this);
            return true;
        } else {
            return false;
        }
    }

    removeInLocalStorage() {
        localStorage.removeItem("AarwolfVacumn");
    }
}

class AVLocalSetting extends AVSettingData {
    constructor() {
        super();

        this.zoomft = {x: 0, y:0, scale:1};
    }
    
    requoteHome() {
        // this.removeInLocalStorage();
        // this.loadType = null;
        // this.craneType = 'floor-mounted-crane';
        // this.jibLength = '2.5m';
        // this.workLoadLimit = null;
        // this.selectedUnit = 'm';

        ['loadType','jibLength','craneType','workLoadLimit'].forEach(k => {
            document.querySelectorAll(`input[name='${k}']`).forEach((radio) => {
                radio.checked = false;
            });
        });
            
        document.querySelector('#floor-mounted-crane').checked = true;
        document.querySelector('#\\32\\.5m').checked = true;
        
        document.querySelectorAll('input[name="loadType"]').forEach(radio => {
            document.querySelectorAll(`label[for="${radio.id}"]`).forEach((txt) => {
                txt.disabled = true;
            });

            radio.disabled = true;
        });

        document.querySelectorAll('input[name="jibLength"]').forEach(radio => {
            document.querySelectorAll(`label[for="${radio.id}"]`).forEach((txt) => {
                txt.disabled = false;
            });

            radio.disabled = false;
        });

        this.readUI();
    }


// console.log(WORKLOAD_DATA);
    resetAll() {
        this.userName = null;
        
        this.priceLiftTubeSize = null;
        this.priceLiftTubePower = null;

        this.totalPrice = 0;
        this.priceList = null;
        
        this.requoteHome();
    }

    readWorkload(key) {
        console.log(key, WORKLOAD_DATA[key]);
        return WORKLOAD_DATA[key][this.selectedUnit];
    }

    readUI() {
        if(document.getElementById('unitSelect'))
        {
            this.selectedUnit = document.getElementById('unitSelect').value;



            
            ['loadType','jibLength','craneType','workLoadLimit'].forEach(k => {
                this[k] = null;
                document.querySelectorAll(`input[name='${k}']`).forEach((radio) => {
                    if(radio.checked)
                        this[k] = radio.id;
                });
            });



        
            this.applyUIEnableState();
        }
    }
    

    writeUI(){
        if(document.getElementById('unitSelect'))
        {
            document.getElementById('unitSelect').value = this.selectedUnit;
            document.getElementById('unitSelect').dispatchEvent(new Event('change'));

            ['loadType','jibLength','craneType','workLoadLimit'].forEach(k => {
                document.querySelectorAll(`input[name='${k}']`).forEach((radio) => {
                    if(radio.id === this[k])
                        radio.checked = true;
                });
            });
            
            this.applyUIEnableState();
        }
    }

    applyUIEnableState(){
        let total = [...document.querySelectorAll('input[name="workLoadLimit"]')].filter(radio => radio.checked).length;
        
        document.querySelectorAll('input[name="loadType"]').forEach((radio) => {
            document.querySelectorAll(`label[for="${radio.id}"]`).forEach((txt) => {
                txt.disabled = total === 0;
            });
    
            radio.disabled = total === 0;
        });

        // validateCraneRadio('floor-mounted-crane',[],'');
        this.validateCraneRadio('mobile-crane',['4m','5m'],'2.5m');
        this.validateCraneRadio('wall-mounted-crane',['2.5m'],'3m');
    }
    
    validateCraneRadio(crane_key, unvalid_jibs, default_jib) {
        document.querySelectorAll(`input[name='craneType']`).forEach(radio => {
            if(radio.checked && crane_key === radio.id)
            {
                document.querySelectorAll('input[name="jibLength"]').forEach(jibradio => {
                    if(jibradio.checked && unvalid_jibs.includes(jibradio.id))
                    {
                        jibradio.checked = false;
                        document.getElementById(default_jib).checked = true;
                        return;
                    }
                });
            }
        });
    }

    getCurrentWorkload() {
        return this.readWorkload(this.workLoadLimit);
    }

    getCurrentLiftTubeSize() {
        var itm = this.getCurrentWorkload();
        return itm.liftTubeSize;
    }

    getCurrentLiftTubPower() {
        var itm = this.getCurrentWorkload();
        return itm.liftTubePower;
    }

    priceResult(_crane, _head_stack, _suction_pack) {
        if(!this.priceList) return 0;

        const price_list = this.priceList;
        
        var total = 0;

        if(price_list)
        {
            if(this.workLoadLimit)
            {
                var itm = this.readWorkload(this.workLoadLimit);
                let liftTubeSize = itm.liftTubeSize;
                let liftTubePower = itm.liftTubePower;
                
                var res = '';

                if(liftTubeSize)
                {
                    // console.log(liftTubeSize,parseFeetAndInches(liftTubeSize));

                    if(liftTubeSize.includes('"'))
                        liftTubeSize = parseFeetAndInches(liftTubeSize).toString();
                    else 
                        liftTubeSize = liftTubeSize.replace('mm','').trimEnd();

                    // console.log('liftTubeSize',liftTubeSize);

                    res = `Tube: ${price_list['tube'][liftTubeSize]} + `;
                    total += price_list['tube'][liftTubeSize];
                }
                
                const motor =  liftTubePower ? liftTubePower.split('/').pop().replace(' ','').replace('.0','') : "3.8kw";

                res +=  `Motor: ${price_list['motor'][motor]} + `;
                total += price_list['motor'][motor];

                res +=  `Crane: ${price_list['crane'][_crane.key]} + `;
                total += price_list['crane'][_crane.key];

                res +=  `Filter: ${price_list['filter'][ motor === '8kw' ? "zfp300" : "zfp120" ]} + `;
                total += price_list['filter'][ motor === '8kw' ? "zfp300" : "zfp120" ];

                res += `Power: ${price_list['power']["power_1"]} + `;
                total += price_list['power']["power_1"];

                if(_head_stack && _suction_pack)
                {
                    res += `Head: ${price_list['control_head'][_head_stack.key]} + `;
                    total += price_list['control_head'][_head_stack.key];
                    
                    res += `Pad: ${price_list['suction_pad'][_suction_pack.key]}`;
                    total += price_list['suction_pad'][_suction_pack.key];
                }

                this.totalPrice = total.toLocaleString('en-US') + '$';
                console.log(res, '= Price:$', total.toLocaleString('en-US'));
            }
        }

        return total;
    }


    get3DData() {
        let loadType = this.loadType;
        let jibLength = parseFloat(this.jibLength.replace('m',''));

        let craneType = this.craneType;
        if(!craneType) craneType = ALL_SCENES[0].name;

        let liftTubeSize = this.workLoadLimit ? this.getCurrentLiftTubeSize() : null;

        window.SettingObj.printAll('select_crane>>');

        let _crane = undefined;
        let _pump_group = undefined;
        let _tube = undefined;
        let _head_stack = undefined;
        let _suction_pack = undefined;
        // console.log('Length', jibLength);

        

        if(craneType.toLowerCase().includes("wall"))
        {
            if(jibLength <= 3)
                _crane = ALL_SCENES[6];
            else if(jibLength < 5)
                _crane = ALL_SCENES[7];
            else
                _crane = ALL_SCENES[8];
            
            _pump_group = PUMP_GROUPS[1];
        }
        else 
        {
            if(craneType.toLowerCase().includes("mobile"))
            {
                if(jibLength < 3)
                    _crane = ALL_SCENES[0];
                else
                    _crane = ALL_SCENES[1];
            } else 
            {
                if(jibLength < 3)
                    _crane = ALL_SCENES[2];
                else if(jibLength === 3)
                    _crane = ALL_SCENES[3];
                else if(jibLength < 5)
                    _crane = ALL_SCENES[4];
                else
                    _crane = ALL_SCENES[5];
            }

            _pump_group = PUMP_GROUPS[0];
        }

        this.sceneData = _crane;

        if(liftTubeSize)
            _tube = {name:Number(liftTubeSize) <= 120 ? small_tube.name: big_tube.name};
        else
            _pump_group = undefined;
        // console.log(_tube);
        if(loadType)
        {
            if(loadType.toLowerCase().includes("300max"))
            {
                _head_stack = HEAD_STACKS[0];
                _suction_pack = SUCTION_PACKS[0];
                this.zoomft = {x: 0, y:-30, scale:0.15};
            }
            else if(loadType.toLowerCase().includes("400large"))
            {
                _head_stack = HEAD_STACKS[3];
                _suction_pack = SUCTION_PACKS[2];
                this.zoomft = {x: -2, y:-18, scale:0.15};
            }
            else if(loadType.toLowerCase().includes("bags"))
            {
                _head_stack = HEAD_STACKS[3];
                _suction_pack = SUCTION_PACKS[3];
                this.zoomft = {x: -5, y:-15, scale:0.15};
            }
            else if(loadType.toLowerCase().includes("medium"))
            {
                _head_stack = HEAD_STACKS[0];
                _suction_pack = SUCTION_PACKS[1];
                this.zoomft = {x: 0, y:-25, scale:0.15};
            }
            else if(loadType.toLowerCase().includes("high"))
            {
                _head_stack = HEAD_STACKS[1];
                _suction_pack = SUCTION_PACKS[2];
                this.zoomft = {x: -12, y:-2, scale:0.11};
            }
            else if(loadType.toLowerCase().includes("sheet"))
            {
                _head_stack = HEAD_STACKS[2];
                _suction_pack = SUCTION_PACKS[4];
                this.zoomft = {x: -10, y:-6, scale:0.1};
            }

            window.SettingObj.outputFile = `${craneType}_${jibLength}_${liftTubeSize}_${loadType}.pdf`;
        }
        
        if(_tube && _crane.name.toLowerCase().includes('articulated'))
            _tube.name = _tube.name.replace(' ID ', ' SM ');

        this.data3D = [_crane, _pump_group, _tube, _head_stack, _suction_pack];

        return this.data3D;
    }

    printAll(caption) {
        var msg = `<${caption}> - loadType:${this.loadType};`
                    + ` - craneType:${this.craneType}`
                    + ` - jibLength:${this.jibLength}`
                    + ` - username:${this.userName}`
                    + ` - workLoadLimit:${this.workLoadLimit}`;

        if(this.workLoadLimit)
            msg += ` - liftTubeSize:${this.getCurrentWorkload(this.workLoadLimit).liftTubeSize}`
                    + ` - liftTubePower:${this.getCurrentWorkload(this.workLoadLimit).liftTubePower}`
                    + ` - maxLiftingCapacity:${this.getCurrentWorkload(this.workLoadLimit).maxLiftingCapacity}`
                    + ` - minLiftingCapacity:${this.getCurrentWorkload(this.workLoadLimit).minLiftingCapacity}`
                    
                    // + ` - is_back:${this._is_back_from_page_2')}`;
                    
        console.log(msg);
    }
}


