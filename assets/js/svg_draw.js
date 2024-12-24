const { rgb, degrees } = PDFLib;

export class SvgDrawCls {
    constructor(pdfSaverObj, x, y, w, h) {
        this.data = pdfSaverObj.data;
        this.drw = pdfSaverObj.drw;
        
        this.page = pdfSaverObj.page;

        this.svgFiles = pdfSaverObj.svgFiles;
                
        this.crane = this.svgFiles[0];
        this.pump = this.svgFiles[1];
        this.tube = this.svgFiles[2];
        this.head  = this.svgFiles[3]; 
        this.pad  = this.svgFiles[4];
        
        this.x = pdfSaverObj.margin_left;
        this.y = y;
        this.w = w;
        this.h = h;

        this.fz = this.drw * 2.7;
        this.dimfz = this.drw * 2.7;
        this.thick = pdfSaverObj.thick;

        this.font_open_sans = pdfSaverObj.font_open_sans;
    }

    istyp(key) {
        return this.crane.path.toLowerCase().includes(key);
    }

    async loadSVGResource(file) {
        const response = await fetch('models/svg/' + file + '.svg');
        if (!response.ok) {
            console.error(`Failed to load SVG file: ${file}`);
            return [];
        }
        console.log('models/svg/' + file + '.svg');
    
        const svgText = await response.text();
        const lines = svgText.split('\n');
    
        // Duyệt qua từng dòng trong SVG
        let valid_content = lines.filter(line => line.includes('<polyline') || line.includes('svg')).join("\n");
    
        const parser = new DOMParser();
        const svgDocument = parser.parseFromString(valid_content, 'image/svg+xml');
    
        const polylineElements = svgDocument.querySelectorAll('polyline');
    
        return Array.from(svgDocument.querySelectorAll('polyline'));
    }

    calculateGlobalBounds(lsOfLsObjs) {
        if (lsOfLsObjs.length === 0) {
            return null; // Không có danh sách nào
        }
    
        let xMin = Infinity, xMax = -Infinity;
        let yMin = Infinity, yMax = -Infinity;
    
        lsOfLsObjs.forEach(lsObjs => {
            lsObjs.forEach(point => {
                xMin = Math.min(xMin, point.x);
                xMax = Math.max(xMax, point.x);
                yMin = Math.min(yMin, point.y);
                yMax = Math.max(yMax, point.y);
            });
        });
    
        return {
            xMin: xMin,
            xMax: xMax,
            yMin: yMin,
            yMax: yMax,
            width: xMax - xMin,
            height: yMax - yMin
        };
    }
    
    scalePls(pls, sc, m = 0){
        pls.forEach(ls => ls.forEach(p => {
            p.x = p.x * sc + m;
            p.y = p.y * sc + m;
        }));
    }
    
    async drawSvg() {
        let dx = this.data.dx;
        let dy = this.data.dy;
    
        this.zoom_objs = [];
        
        let pls = [];
        
        for(let index = 0; index < this.svgFiles.length; index ++) 
        {
            const file = this.svgFiles[index];
            var polylineElements =  await this.loadSVGResource(file.path);
            
            // console.log(file, polylineElements.length, 'pos', this.sc, file.x, file.y);
            
            for (const polyline of polylineElements) {
                let ___ls = [];
                const pointsAttr = polyline.getAttribute('points');
                if (pointsAttr) 
                {
                    var i = 0;
                    var ls = [];
    
                    const path = pointsAttr.split(',').map(point => {
                        const [x, y] = point.split(' ').map(Number);
                        
                        const _p = {x: (file.x + x), y: - (file.y + y)};
                        ls.push(_p);
    
                        if(index === 3 || index === 4)
                            ___ls.push({x: (x), y: - (y)});
    
                        return `${_p.x}, ${_p.y}`;
                    }).join(' L ');
                }

                pls.push(ls);
                if(___ls.length > 0) this.zoom_objs.push(___ls);
            }
        }

        let bb = this.calculateGlobalBounds(pls);
        let m = 5 * this.drw;
        // this.sc = Math.min(this.w * this.drw/ (bb.width + 2 * m), this.h * this.drw/ (bb.height + m));

        // if(this.istyp('arti'))
        //     this.sc = 0.065;
        // else if(this.istyp('4m'))
        //     this.sc = 0.058;
        // else if(this.istyp('5m'))
        //     this.sc = this.w / (bb.width + 2 * m);
        // else
        //     this.sc = 0.09;

        let rw = bb.width + (this.istyp('5m') ? 400 : 0);
        let rh = bb.height + 20 * m;
        this.sc = Math.min(this.w / rw, this.h / rh);

        this.x = (210 * this.drw - (dx[0] + dx[1] + dx[2]) * this.sc) / 2;

        // if(this.istyp('arti')) this.x += 20;

        console.log('sc',this.x, bb.width, this.w);
        
        this.scalePls(pls, this.sc);
        
        let nx = 0;

        // git commit -m "Go intergrate"
        // else if(this.crane.path.includes('4m'))
        //     nx = 30;
        // else if(this.crane.path.includes('5m'))
        //     nx = 0;
        // else
        //     nx = 50;
        let pad_y = this.tube.path.includes('SM') ? -15: (this.istyp('arti') ? 45 : 25);

        if(this.istyp('4m') || this.istyp('5m'))
            pad_y = 12;

        if(this.istyp('one') && this.istyp('mobile'))
            pad_y = 45;

        // if(this.tube.path.includes('SM'))
        //     pad_y = -15;
        // else
        // {
        //     pad_y = window.SettingObj.posPad.z * this.sc /  this.drw;
        //     console.log(pad_y);
        //     // if(pad_y > 10)
        //     {
        //         // pad_y += 10 * this.drw;

        //         if(this.pad.path.toLowerCase().includes('multi'))
        //             pad_y = pad_y + 5 * this.drw;
        //     }
        // }

        this.drawPls(pls, nx);

        this.page.drawText('A', {
            x: nx + this.x + this.head.x * this.sc - this.dimfz / 2, 
            y: this.y + pad_y,
            size: this.dimfz * 2, font: this.font_open_sans, color: rgb(0, 0, 0), textAlign: 'center',});
        
        this.drawZoom(this.font_open_sans);

        this.page.drawLine({start: { x: nx + this.x -  this.drw * 15, y:   this.y }, 
            end: { x:  nx + this.x + (dx[0] + dx[1] + dx[2]) * this.sc +  this.drw * 12.5, y:   this.y },
            thickness: this.thick * 5, color: rgb(0, 0, 0),});
            
        let __y = this.y + (dy[0] + 500) * this.sc;

        this.drawDimension(nx + this.x + dx[0] * this.sc,
            nx + this.x + (dx[0] + dx[1]) * this.sc, __y, m,
            this.data.vx ? this.data.vx[1]: dx[1]); // Ngang
    
        // console.log(this.x, dx[0], dx[1], dx[2], this.sc);
        if(dx[2] != 0)
            this.drawDimension(nx + this.x + (dx[0] + dx[1]) * this.sc, 
                nx + this.x + (dx[0] + dx[1] + dx[2]) * this.sc, __y, m,
                this.data.vx ? this.data.vx[2]: dx[2]); // Ngang

        // console.log(this.y, dy[0], this.sc);
        
        this.drawVerticalDimension(nx + this.x - 800 * this.sc, -  this.y, 
            - this.y - dy[0] * this.sc, m, this.data.vy[0]);
        this.drawVerticalDimension(nx + this.x + (dx[0] + dx[1] + dx[2] + 800) * this.sc, 
            - this.y, -  this.y  - dy[1] * this.sc, m, this.data.vy[1]); // Ngang
    }

    // title_pos_y() {
    //     let res = this.y - this.pad.y * this.sc - 20;

    //     if(this._is_high_head() || this._is_extra_head())
    //         res -= 30;

    //     if(this._is_2_5m())
    //         res = this.y - 15;

    //     return res;
    // }

    drawPls(pls, x, y = 0) {
        for(let j = 0; j < pls.length; j++)
            for(let i = 0; i < pls[j].length - 1; i++)
            {
                let ls = pls[j];
                // console.log(this.x, x, ls[i].x);
                this.page.drawLine({start: { x: this.x + x + ls[i].x, y: this.y + y + ls[i].y }, 
                    end: { x: this.x + x + ls[i + 1].x, y: this.y + y + ls[i + 1].y },
                    thickness: this.thick * 5, color: rgb(0, 0, 0)});
            }
    }
    
    drawZoom(font) {
        let _zoom_x = window.SettingObj.zoomft.x;
        let _zoom_y = window.SettingObj.zoomft.y;

        this.scalePls(this.zoom_objs, window.SettingObj.zoomft.scale,  window.SettingObj.zoomft.x);
            
        // let bb = this.calculateGlobalBounds(this.zoom_objs);
        
        let bx = this.drw * 105;
        let by = this.y + 60;

        this.drawPls(this.zoom_objs, bx + _zoom_x - this.x, by + _zoom_y - this.y);
        
        this.page.drawCircle({x: bx, y: by, size: 21 * this.drw, // Diameter of the circle
            borderColor: rgb(0, 0, 0), // Circle border color (blue)
            borderWidth: 0.1, // Circle border width
        });
    
        this.page.drawText('A', {
            x: bx - this.dimfz , y: this.y - 15,
            size: this.dimfz * 2, font: font, color: rgb(0, 0, 0), textAlign: 'center',});
    }
    
    formatUnit(length) {
        var selectedUnit = window.SettingObj.selectedUnit;
        
        if(!selectedUnit)
            selectedUnit = 'm';
    
        let convertedLength;
        let unitText;
    
        // Nếu đơn vị là 'm', hiển thị giá trị tính bằng mm
        if (selectedUnit === 'm') {
            unitText = `${Math.round(length)} mm`;
        } else {
            // Nếu đơn vị là 'inch', chuyển đổi ra inches và feet
            convertedLength = length / 25.4; // Convert từ mm sang inches
            const feet = Math.floor(convertedLength / 12); // Tính số feet
            const inches = Math.round(convertedLength % 12); // Tính số inches dư
    
            // Nếu feet > 0, hiển thị "x' y''"
            if (feet > 0) {
                unitText = `${feet}' ${inches}"`;
            } else {
                // Nếu không có feet, chỉ hiển thị inches
                unitText = `${inches}"`;
            }
        }
    
        return unitText;
    }
    
    // Hàm vẽ kích thước đứng
    drawVerticalDimension(x, y1, y2, h, txt_override = 0) {
        const p1 = { x: x, y: -y1 };
        const p2 = { x: x, y: -y2 };
        const dy = Math.abs(p2.y - p1.y);
        const length = txt_override !== 0 ? txt_override : dy;
    
        // Đường chính
        this.page.drawLine({start: { x: p1.x, y: p1.y }, end: { x: p2.x, y: p2.y },
            thickness: this.thick, color: rgb(0, 0, 0),});
    
        // Mũi tên đầu
        this.drawArrow(p1.x, p1.y, "down");
        // Mũi tên cuối
        this.drawArrow(p2.x, p2.y, "up");
    
        // Đường ngang phụ tại p1
        this.page.drawLine({start: { x: p1.x - h, y: p1.y }, end: { x: p1.x + h, y: p1.y },
            thickness: this.thick, color: rgb(0, 0, 0),});
    
        // Đường ngang phụ tại p2
        this.page.drawLine({start: { x: p2.x - h, y: p2.y },end: { x: p2.x + h, y: p2.y },
            thickness: this.thick,color: rgb(0, 0, 0),});
    
        this.page.drawText(`${this.formatUnit(length)}`, {x: p1.x - 1, y: (p1.y + p2.y) / 2 - 5,
            size: this.dimfz, font: this.font_open_sans, color: rgb(0, 0, 0), rotate: degrees(90)});
    }
    
    drawDimension(x1, x2, y, h, txt_override = 0) {
        const p1 = { x: x1, y: y };
        const p2 = { x: x2, y: y };
        const dx = Math.abs(p2.x - p1.x);
        const length = txt_override !== 0 ? txt_override : dx;
        
        // Đường chính
        this.page.drawLine({start: { x: p1.x, y: p1.y }, end: { x: p2.x, y: p2.y },
            thickness: this.thick, color: rgb(0, 0, 0)});
    
        // Mũi tên đầu
        this.drawArrow(p1.x, p1.y, "left");
        // Mũi tên cuối
        this.drawArrow(p2.x, p2.y, "right");
    
        this.page.drawLine({start: { x: p1.x, y: p1.y - h }, end: { x: p1.x, y: p1.y + h },
            thickness: this.thick,color: rgb(0, 0, 0),});
    
        this.page.drawLine({start: { x: p2.x, y: p2.y - h },end: { x: p2.x, y: p2.y + h },
            thickness: this.thick,color: rgb(0, 0, 0),});
    
        this.page.drawText(`${this.formatUnit(length)}`, {x: (p1.x + p2.x) / 2 - 5,y: p1.y + 1,
        size: this.dimfz, font: this.font_open_sans, color: rgb(0, 0, 0),textAlign: 'middle',});
    }
    
    drawArrow(x, y, direction) {
        const sz = this.drw * 2; // Kích thước mũi tên
        let path;
    
        if (direction === "up")
            path = `${x - sz/4} ${-y + sz} L ${x} ${-y} L ${x + sz/4} ${-y + sz} Z`;
        else if (direction === "down")
            path = `${x - sz/4} ${-y - sz} L ${x} ${-y} L ${x + sz/4} ${-y - sz} Z`;
        else if (direction === "left")
            path = `${x + sz} ${-y + sz/4} L ${x} ${-y} L ${x + sz} ${-y - sz/4} Z`;
        else if (direction === "right")
            path = `${x - sz} ${-y + sz/4} L ${x} ${-y} L ${x - sz} ${-y - sz/4} Z`;
        
        if(path)
            this.page.drawSvgPath(`M ${path}`, {color: rgb(0, 0, 0),borderColor: rgb(0, 0, 0), borderWidth: 0});
    }
}

