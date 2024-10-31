
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
}



