export function gFillData(st)
{
let p1 = st.indexOf('fill:');
    let res = null;

    if(p1 != -1)
    {
        let p2 = st.indexOf(';', p1);

        if(p2 != -1)
        {
            res = st.substring(p1 + 5, p2);
        }
    }
    
    return res;
}

export function ReadSettings(st)
{
    let val = _prop(st);
    let name = _propname(st);
    let valnum = (val == null || val == '') ? NaN : Number(val);

    if(name == 'Scale')
    {
        //console.log(val);
        scale = valnum;
        if(scale == NaN) scale = 1;
    }

    if(name == 'WallHeight')
    {
        //console.log(val);
        wall_height = valnum;
        if(wall_height == NaN) wall_height = 3000;
    }

    if(name == 'WallTop')
    {
        if(!isNaN(valnum)) 
        {
            wall_top = valnum;
            show_wall_top = true;
        }
        else
            show_wall_top = false;

        //console.log('WallTop=' + valnum + ',' + show_wall_top + '[' + wall_top + ']');
    }

    if(name == 'WallBorder')
    {
        if(!isNaN(valnum)) 
        {
            wall_border = valnum;
            show_wall_border = true;
        }
        else
            show_wall_border = false;
    }

    if(name == 'CeilBorder')
    {
        if(!isNaN(valnum)) 
        {
            ceil_border = valnum;
            show_ceil_border = true;
        }
        else
            show_ceil_border = false;
    }


    if(name == 'WallBottom')
    {
        
        if(!isNaN(valnum)) 
        {
            wall_bottom = valnum;
            show_wall_bottom = true;
        }
        else
            show_wall_bottom = false;
        //console.log(val);
    }

    if(name == 'WindowTop')
    {
        window_top = valnum;
        if(window_top == NaN) window_top = 3000;
        //console.log(val);
    }

    if(name == 'WindowBottom')
    {
        window_bottom = valnum;
        if(window_bottom == NaN) window_bottom = 3000;
        //console.log(val);
    }

    if(name == 'DoorTop')
    {
        door_top = valnum;
        if(door_top == NaN) door_top = 2200;
        //console.log(val);
    }

    if(name == 'DisplayFilter')
    {
        let _st = val;

        if(_st != null)
            display_filter = _st.split(",");
        //console.log('[' + val + ']');
    }
}

export function _prop(src)
{
    let res = null;

    if( src.indexOf('<!--') != -1)
    {
        let st = src.replace('-->','').replace('<!--','');
        //.replace('=','').replace(' ','');
        //if(src.indexOf('WallTop') != -1)
        //    console.log('RS=' + '[' + st + ']');

        let ar = st.split('=');
        ////console.log(ar.length);
        
        if(ar.length > 1)
            res = ar[1].trim();
        else
            res = ar[0].trim();
    }

    //if(src.indexOf('WallTop') != -1)
    //    console.log('RS=' + '[' + st + ']<' + res + '>');

    return res;
}

export function _propname(src)
{
    let res = null;
    
    if( src.indexOf('<!--') != -1)
    {
        let st = src.replace('-->','').replace('<!--','');
        res = st.split('=')[0].trim();
    }

    return res;
}

export let scale = 1;

export let show_wall_top = false;
export let show_wall_bottom = false;
export let show_wall_border = false;
export let show_ceil_border = false;

export let wall_top = 3000;
export let wall_bottom = 0;
export let wall_border = 0;
export let ceil_border = 0;
export let wall_height = 3000;

export let door_top = 2200;
export let window_bottom = 600;
export let window_top = 2200;
export let display_filter = null;

//export { ReadSettings, _prop, _propname, scale, wall_top, door_top, window_bottom, window_top, display_filter};