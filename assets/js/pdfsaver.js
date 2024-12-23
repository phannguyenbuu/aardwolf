import { showProgressBar, hideProgressBar, set_progress_bar } from './sceneloader.js';
import { SvgDrawCls } from './svg_draw.js';

const { PDFDocument, StandardFonts, rgb } = PDFLib;
const fontkit = window.fontkit;

export class PdfSaverCls {
    constructor() {
        this.thick = 0.01;
        this.drw = 2.54;
        this.margin_left = this.drw * 19.1;
        this.margin_right = this.drw * 19.1;
        this.font_sz = this.drw * 2.7;
        this.dim_font_size = this.drw * 2.7;
        this.rowHeight = this.drw * 7.4;

        this.openSansFontUrl = "./assets/fonts/open-sans.regular.ttf";
        this.openSansFontBoldUrl = "./assets/fonts/open-sans.bold.ttf";

        this.font_open_sans = null;
        this.font_open_sans_bold = null;
    }

    async initFonts(pdfDoc) {
        pdfDoc.registerFontkit(fontkit);

        // Load fonts
        const boldFontBytes = await fetch(this.openSansFontBoldUrl).then((res) => res.arrayBuffer());
        this.font_open_sans_bold = await pdfDoc.embedFont(boldFontBytes);

        const regularFontBytes = await fetch(this.openSansFontUrl).then((res) => res.arrayBuffer());
        this.font_open_sans = await pdfDoc.embedFont(regularFontBytes);
    }

    draw_table_content(bottom_y) {
        const labels = [
            'Maximum lifting capacity', 'Lift tube size', 'Electrical vacuum pump',
            'Vertical movement (Stroke)', '2.5m lift tube (standard)', 'Installation height',
            'Safety factor'
        ];

        const xOffset = this.drw * 106;
        
        const cellPadding = this.drw * 5;

        labels.forEach((label, index) => {
            this.drawText(label, this.margin_left + this.drw * 2.5, 
                bottom_y - this.rowHeight * index - cellPadding, this.font_sz, true);
        });

        const dataitm = window.SettingObj.getCurrentWorkload();

        [{key:'maxLiftingCapacity', y:0},
        {key:'liftTubeSize', y:1},
        {key:'liftTubePower', y:2},
        {key:'liftTube17', y:4},
        {key:'liftTube29', y:5},
        {key:'2.5 minimum', y: 6}].forEach(itm => {

            let s = (itm.key === 'liftTubeSize' ? 'Ø' : '') + dataitm[itm.key];
            if(itm.key.includes('2.5')) s = itm.key;

            this.drawText(s, xOffset, bottom_y - this.rowHeight * itm.y - cellPadding, this.font_sz);
        });
    }

    draw_table_border(bottom_y, total, thickness, color) {
        const startX = this.margin_left;
        const endX = this.drw * 210 - this.margin_right;
        // const rowHeight = this.drw * 7.4;
        const middleX = startX + (endX - startX) / 2;

        for (let i = 0; i <= total; i++) {
            const currentY = bottom_y - i * this.rowHeight;

            this.page.drawLine({ start: { x: middleX, y: currentY }, end: { x: endX, y: currentY }, thickness, color });
            if (i < total && i != 3) {
                this.page.drawRectangle({ x: startX, y: currentY - this.rowHeight, width: middleX - startX, height: this.rowHeight, color, borderWidth: 0 });
            }
        }

        for (let i = 0; i <= total; i++) {
            const currentY = bottom_y - i * this.rowHeight;

            let wclr = rgb(1,1,1);
            this.page.drawLine({ start: { x: startX, y: currentY }, end: { x: middleX, y: currentY }, thickness, color:wclr });
        }

        this.page.drawLine({ start: { x: startX, y: bottom_y }, end: { x: startX, y: bottom_y - total * this.rowHeight }, thickness, color });
        this.page.drawLine({ start: { x: middleX, y: bottom_y }, end: { x: middleX, y: bottom_y - total * this.rowHeight }, thickness, color });
        this.page.drawLine({ start: { x: endX, y: bottom_y }, end: { x: endX, y: bottom_y - total * this.rowHeight }, thickness, color });
    }

    drawText(text, x, y, fontSize, bold = false, alignment = 0) {
        const font = bold ? this.font_open_sans_bold : this.font_open_sans;
        this.page.drawText(text, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
    }

    async generatePDF(dataItm) {
        if(window.innerWidth > 820)
            showProgressBar();

        set_progress_bar(0);

        this.data = dataItm.sceneData;

        try {
            const pdfDoc = await PDFDocument.create();
            await this.initFonts(pdfDoc);
            const imageBytes = await fetch('models/logo.jpg').then((res) => res.arrayBuffer());

            // Nhúng hình ảnh vào PDF
            this.logoImage = await pdfDoc.embedJpg(imageBytes); // Dùng embedPng() nếu ảnh là PNG

            this.svgFiles = dataItm.pdfContent;
            await this.drawCanvas2D(pdfDoc);

            const pdfBytes = await pdfDoc.save();
            this.downloadPDF(pdfBytes);
            progressBarContainer.style.display = 'none';
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            set_progress_bar(100);
            // setTimeout(hideProgressBar, 500);
        }
    }

    async drawCanvas2D(pdfDoc) {
        this.page = pdfDoc.addPage([this.drw * 210, this.drw * 297]);
        this.draw_txt('QUOTATION', this.drw * 19.2, this.drw * 278.7, this.drw * 4, true, 0);

        //Draw SVG
        
        
        //Content
        var bottom_y = this.drw * 143.4; // base_y - this.drw * 13;
        this.draw_txt('1  ITEM DESCRIPTION', this.margin_left + this.drw * 1.7, bottom_y, this.font_sz, true, 1);
        
        bottom_y -= this.drw * 2.2; //this.drw * 2.2;
        this.page.drawLine({start: { x: this.margin_left, y: bottom_y }, 
            end: { x: this.drw * 210 - this.margin_right, y: bottom_y },
            thickness: this.thick * 50,color: rgb(1, 0, 0),});

        bottom_y -= this.drw * 7.3; //this.drw * 8.2;
        this.draw_txt('Aardwolf Vacuum Tube Lifter', this.margin_left, bottom_y, this.drw * 4, true, 0);

        bottom_y -= this.drw * 4.9; //this.drw * 6.4;
        this.draw_txt('The above drawing is based on information provided by the buyer. The Aardwolf vacuum tube lifter is',
            this.margin_left, bottom_y, this.font_sz, false, 2, this.margin_right - this.margin_left);

        this.draw_txt('combined with a crane, vacuum generator, suction supply hose, lift tube, control unit and suction head',
        this.margin_left, bottom_y - this.drw * 4, this.font_sz, false, 2, this.margin_right - this.margin_left);

        bottom_y -= this.drw * 11.6; //this.drw * 9.8;
        
        const dataitm = window.SettingObj.getCurrentWorkload();

        this.draw_txt(`Lifting capacity: ${dataitm.maxLiftingCapacity}. (As per customer’s request). The Aardwolf Vacuum Tube Lifter is a classic`,
            this.margin_left, bottom_y, this.font_sz);
        
        this.draw_txt(`design typically suited for loads between ${ dataitm.minLiftingCapacity} - ${dataitm.maxLiftingCapacity}.`, 
            this.margin_left, bottom_y - this.drw * 4, this.font_sz);

        bottom_y -= this.drw * 15.3; //this.drw * 9.8;
        this.draw_txt('2  TECHNICAL DATA', this.margin_left + this.drw * 1.7, bottom_y, this.font_sz, true, 1);

        bottom_y -= this.drw * 2.4; //this.drw * 2.2;
        this.page.drawLine({start: { x: this.margin_left, y: bottom_y }, 
            end: { x: this.drw * 210 - this.margin_right, y: bottom_y },
            thickness: this.thick * 50, color: rgb(1, 0, 0),});
        
        bottom_y -= this.drw * 3.5; //this.drw * 4;
        this.draw_table_border(bottom_y, 7, this.thick, rgb(0.8,0.8,0.8));
        this.draw_table_content(bottom_y);

        bottom_y = this.drw * 39.3; //this.drw * 64;
        this.draw_txt('Note:', this.margin_left, bottom_y, this.font_sz, true, 1);
        this.draw_txt('It is recommended that the buyer purchase extra vacuum heads to cover all eventualities such as',
        this.margin_left + this.drw * 10, bottom_y, this.font_sz, false, 2, this.margin_right - this.margin_left);

        this.draw_txt('different carton sizes and the possibility of porous materials.', this.margin_left + this.drw * 10, 
            bottom_y - this.drw * 4, this.font_sz);

        bottom_y -= this.drw * 14.5; //this.drw * 11.1;
        
        this.draw_txt('Quotation:', this.margin_left + this.drw * 68, bottom_y, this.font_sz, true, 1);
        
        console.log('window.SettingObj.userName',window.SettingObj.userName);
        this.draw_txt(`${window.SettingObj.userName ? window.SettingObj.totalPrice : ''}`,
            this.margin_left + this.drw * 90, bottom_y, this.font_sz, true, 0);

        this.page.drawImage(this.logoImage, {x: this.drw * 149, y: this.drw * (297-17), 
            width: 36 * this.drw, height: 9 * this.drw,});

        var svg = new SvgDrawCls(this, this.margin_left, 155 * this.drw, 
            210 * this.drw - (this.margin_right + this.margin_left) - 5 * this.drw, 100 * this.drw);
        await svg.drawSvg(); //this.margin_left + this.drw * 20, base_y
    }
    
    draw_text_with_spacing(txt, x, y, font, font_size, color, letter_spacing = 0) {
        let currentX = x; // Vị trí x hiện tại để vẽ ký tự tiếp theo
        for (let char of txt) {
            this.page.drawText(char, {
                x: currentX,
                y: y,
                size: font_size,
                font: font,
                color: color,
            });
            // Tăng vị trí x, thêm khoảng cách giữa các ký tự
            currentX += font.widthOfTextAtSize(char, this.font_size) + letter_spacing;
        }
    }

    draw_txt(txt, x, y, font_size, bold = false, clr = 2, fit_width = 0) {
        const __clr = clr === 0 ? rgb(1,0,0) : (clr === 1 ? rgb(0,0,0) : rgb(0,0,0));

        if(fit_width === 0)
            this.page.drawText(txt, 
                {x: x, y:y,
                size: 1.33 * font_size, font: bold ? this.font_open_sans_bold : this.font_open_sans,
                color: __clr,textAlign: 'left',});
        else
            draw_text_with_spacing(this.page, txt, x, y,
                bold ? this.font_open_sans_bold : this.font_open_sans, 1.33 * font_size, __clr, fit_width / txt.length);
    }
    
    downloadPDF(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = window.SettingObj.outputFile || 'vector_document.pdf';
        a.click();
        URL.revokeObjectURL(url);
    }
}
