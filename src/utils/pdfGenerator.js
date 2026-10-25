import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

class SvgDrawCls {
    constructor(pdfSaverObj, x, y, w, h) {
        this.data = pdfSaverObj.data;
        this.drw = pdfSaverObj.drw;
        this.page = pdfSaverObj.page;
        this.svgFiles = pdfSaverObj.svgFiles;
        this.selectedUnit = pdfSaverObj.selectedUnit || 'm';
        this.zoomft = pdfSaverObj.zoomft || { x: 0, y: 0, scale: 1 };

        this.crane = this.svgFiles[0];
        this.pump = this.svgFiles[1];
        this.tube = this.svgFiles[2];
        this.head = this.svgFiles[3];
        this.pad = this.svgFiles[4];

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
        return this.crane && this.crane.path.toLowerCase().includes(key);
    }

    async loadSVGResource(file) {
        try {
            const response = await fetch(`/models/svg/${file}.svg`);
            if (!response.ok) {
                console.error(`Failed to load SVG file: ${file}`);
                return [];
            }
            const svgText = await response.text();
            const lines = svgText.split('\n');

            let valid_content = lines.filter(line => line.includes('<polyline') || line.includes('svg')).join("\n");
            const parser = new DOMParser();
            const svgDocument = parser.parseFromString(valid_content, 'image/svg+xml');

            return Array.from(svgDocument.querySelectorAll('polyline'));
        } catch (err) {
            console.error('Error fetching SVG:', err);
            return [];
        }
    }

    getBB(lsOfLsObjs) {
        if (!lsOfLsObjs || lsOfLsObjs.length === 0) return null;

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
            xMin,
            xMax,
            yMin,
            yMax,
            width: xMax - xMin,
            height: yMax - yMin
        };
    }

    scalePls(pls, sc, m = 0) {
        pls.forEach(ls => ls.forEach(p => {
            p.x = p.x * sc + m;
            p.y = p.y * sc + m;
        }));
    }

    async drawSvg() {
        if (!this.data) return;
        const dx = this.data.dx;
        const dy = this.data.dy;

        this.zoom_objs = [];
        const pls = [];

        for (let index = 0; index < this.svgFiles.length; index++) {
            const file = this.svgFiles[index];
            if (!file) continue;
            const polylineElements = await this.loadSVGResource(file.path);

            for (const polyline of polylineElements) {
                let ___ls = [];
                const pointsAttr = polyline.getAttribute('points');
                if (pointsAttr) {
                    const ls = [];
                    pointsAttr.split(',').forEach(point => {
                        const [x, y] = point.split(' ').map(Number);
                        const _p = { x: (file.x + x), y: -(file.y + y) };
                        ls.push(_p);

                        if (index === 3 || index === 4) {
                            ___ls.push({ x: x, y: -y });
                        }
                    });
                    pls.push(ls);
                }
                if (___ls.length > 0) this.zoom_objs.push(___ls);
            }
        }

        const bb = this.getBB(pls);
        if (!bb) return;

        const m = 5 * this.drw;
        const rw = bb.width + (this.istyp('5m') ? 400 : 0);
        const rh = bb.height + 20 * m;
        this.sc = Math.min(this.w / rw, this.h / rh);

        this.x = (210 * this.drw - (dx[0] + dx[1] + dx[2]) * this.sc) / 2;

        let letterAy = this.sc * (-this.svgFiles[4].y + (this.getBB(this.zoom_objs)?.yMin || 0)) - 20;
        if (letterAy < 10) letterAy = -15;

        this.scalePls(pls, this.sc);
        const nx = 0;

        this.drawPls(pls, nx);

        if (this.head) {
            this.page.drawText('A', {
                x: nx + this.x + this.head.x * this.sc - this.dimfz / 2,
                y: this.y + letterAy,
                size: this.dimfz * 2,
                font: this.font_open_sans,
                color: rgb(0, 0, 0),
            });
        }

        this.drawZoom(this.font_open_sans);

        this.page.drawLine({
            start: { x: nx + this.x - this.drw * 15, y: this.y },
            end: { x: nx + this.x + (dx[0] + dx[1] + dx[2]) * this.sc + this.drw * 12.5, y: this.y },
            thickness: this.thick * 5,
            color: rgb(0, 0, 0),
        });

        const __y = this.y + (dy[0] + 500) * this.sc;

        this.drawDimension(
            nx + this.x + dx[0] * this.sc,
            nx + this.x + (dx[0] + dx[1]) * this.sc,
            __y,
            m,
            this.data.vx ? this.data.vx[1] : dx[1]
        );

        if (dx[2] !== 0) {
            this.drawDimension(
                nx + this.x + (dx[0] + dx[1]) * this.sc,
                nx + this.x + (dx[0] + dx[1] + dx[2]) * this.sc,
                __y,
                m,
                this.data.vx ? this.data.vx[2] : dx[2]
            );
        }

        this.drawVerticalDimension(
            nx + this.x - 800 * this.sc,
            -this.y,
            -this.y - dy[0] * this.sc,
            m,
            this.data.vy[0]
        );

        this.drawVerticalDimension(
            nx + this.x + (dx[0] + dx[1] + dx[2] + 800) * this.sc,
            -this.y,
            -this.y - dy[1] * this.sc,
            m,
            this.data.vy[1]
        );
    }

    drawPls(pls, x, y = 0) {
        for (let j = 0; j < pls.length; j++) {
            const ls = pls[j];
            for (let i = 0; i < ls.length - 1; i++) {
                this.page.drawLine({
                    start: { x: this.x + x + ls[i].x, y: this.y + y + ls[i].y },
                    end: { x: this.x + x + ls[i + 1].x, y: this.y + y + ls[i + 1].y },
                    thickness: this.thick * 5,
                    color: rgb(0, 0, 0)
                });
            }
        }
    }

    drawZoom(font) {
        const _zoom_x = this.zoomft.x;
        const _zoom_y = this.zoomft.y;

        this.scalePls(this.zoom_objs, this.zoomft.scale, this.zoomft.x);

        const bx = this.drw * 105;
        const by = this.y + 60;

        this.drawPls(this.zoom_objs, bx + _zoom_x - this.x, by + _zoom_y - this.y);

        this.page.drawCircle({
            x: bx,
            y: by,
            size: 21 * this.drw,
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.1,
        });

        this.page.drawText('A', {
            x: bx - this.dimfz,
            y: this.y - 15,
            size: this.dimfz * 2,
            font: font,
            color: rgb(0, 0, 0),
        });
    }

    formatUnit(length) {
        const selectedUnit = this.selectedUnit || 'm';
        if (selectedUnit === 'm') {
            return `${Math.round(length)} mm`;
        } else {
            const convertedLength = length / 25.4;
            const feet = Math.floor(convertedLength / 12);
            const inches = Math.round(convertedLength % 12);
            return feet > 0 ? `${feet}' ${inches}"` : `${inches}"`;
        }
    }

    drawVerticalDimension(x, y1, y2, h, txt_override = 0) {
        const p1 = { x: x, y: -y1 };
        const p2 = { x: x, y: -y2 };
        const dy = Math.abs(p2.y - p1.y);
        const length = txt_override !== 0 ? txt_override : dy;

        this.page.drawLine({
            start: { x: p1.x, y: p1.y },
            end: { x: p2.x, y: p2.y },
            thickness: this.thick,
            color: rgb(0, 0, 0),
        });

        this.drawArrow(p1.x, p1.y, "down");
        this.drawArrow(p2.x, p2.y, "up");

        this.page.drawLine({
            start: { x: p1.x - h, y: p1.y },
            end: { x: p1.x + h, y: p1.y },
            thickness: this.thick,
            color: rgb(0, 0, 0),
        });

        this.page.drawLine({
            start: { x: p2.x - h, y: p2.y },
            end: { x: p2.x + h, y: p2.y },
            thickness: this.thick,
            color: rgb(0, 0, 0),
        });

        this.page.drawText(`${this.formatUnit(length)}`, {
            x: p1.x - 1,
            y: (p1.y + p2.y) / 2 - 5,
            size: this.dimfz,
            font: this.font_open_sans,
            color: rgb(0, 0, 0),
            rotate: degrees(90)
        });
    }

    drawDimension(x1, x2, y, h, txt_override = 0) {
        const p1 = { x: x1, y: y };
        const p2 = { x: x2, y: y };
        const dx = Math.abs(p2.x - p1.x);
        const length = txt_override !== 0 ? txt_override : dx;

        this.page.drawLine({
            start: { x: p1.x, y: p1.y },
            end: { x: p2.x, y: p2.y },
            thickness: this.thick,
            color: rgb(0, 0, 0)
        });

        this.drawArrow(p1.x, p1.y, "left");
        this.drawArrow(p2.x, p2.y, "right");

        this.page.drawLine({
            start: { x: p1.x, y: p1.y - h },
            end: { x: p1.x, y: p1.y + h },
            thickness: this.thick,
            color: rgb(0, 0, 0),
        });

        this.page.drawLine({
            start: { x: p2.x, y: p2.y - h },
            end: { x: p2.x, y: p2.y + h },
            thickness: this.thick,
            color: rgb(0, 0, 0),
        });

        this.page.drawText(`${this.formatUnit(length)}`, {
            x: (p1.x + p2.x) / 2 - 5,
            y: p1.y + 1,
            size: this.dimfz,
            font: this.font_open_sans,
            color: rgb(0, 0, 0),
        });
    }

    drawArrow(x, y, direction) {
        const sz = this.drw * 2;
        let path;

        if (direction === "up") path = `${x - sz / 4} ${-y + sz} L ${x} ${-y} L ${x + sz / 4} ${-y + sz} Z`;
        else if (direction === "down") path = `${x - sz / 4} ${-y - sz} L ${x} ${-y} L ${x + sz / 4} ${-y - sz} Z`;
        else if (direction === "left") path = `${x + sz} ${-y + sz / 4} L ${x} ${-y} L ${x + sz} ${-y - sz / 4} Z`;
        else if (direction === "right") path = `${x - sz} ${-y + sz / 4} L ${x} ${-y} L ${x - sz} ${-y - sz / 4} Z`;

        if (path) {
            this.page.drawSvgPath(`M ${path}`, {
                color: rgb(0, 0, 0),
                borderColor: rgb(0, 0, 0),
                borderWidth: 0
            });
        }
    }
}

export async function generateQuotationPDF({
    sceneData,
    pdfContent,
    currentWorkload,
    userName,
    totalPrice,
    outputFileName,
    selectedUnit,
    zoomft,
    onProgress
}) {
    if (onProgress) onProgress(10);

    const drw = 2.54;
    const margin_left = drw * 19.1;
    const margin_right = drw * 19.1;
    const font_sz = drw * 2.7;
    const rowHeight = drw * 7.4;
    const thick = 0.1;

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const [boldBytes, regularBytes, imageBytes] = await Promise.all([
        fetch('/assets/fonts/open-sans.bold.ttf').then(res => res.arrayBuffer()),
        fetch('/assets/fonts/open-sans.regular.ttf').then(res => res.arrayBuffer()),
        fetch('/models/logo.jpg').then(res => res.arrayBuffer())
    ]);

    const font_open_sans_bold = await pdfDoc.embedFont(boldBytes);
    const font_open_sans = await pdfDoc.embedFont(regularBytes);
    const logoImage = await pdfDoc.embedJpg(imageBytes);

    if (onProgress) onProgress(40);

    const page = pdfDoc.addPage([drw * 210, drw * 297]);

    const drawTxt = (txt, x, y, size, bold = false, clr = 2) => {
        const textColor = clr === 0 ? rgb(1, 0, 0) : rgb(0, 0, 0);
        page.drawText(txt, {
            x,
            y,
            size: 1.33 * size,
            font: bold ? font_open_sans_bold : font_open_sans,
            color: textColor
        });
    };

    drawTxt('QUOTATION', drw * 19.2, drw * 278.7, drw * 4, true, 0);

    let bottom_y = drw * 143.4;
    drawTxt('1  ITEM DESCRIPTION', margin_left + drw * 1.7, bottom_y, font_sz, true, 1);

    bottom_y -= drw * 2.2;
    page.drawLine({
        start: { x: margin_left, y: bottom_y },
        end: { x: drw * 210 - margin_right, y: bottom_y },
        thickness: thick,
        color: rgb(1, 0, 0),
    });

    bottom_y -= drw * 7.3;
    drawTxt('Aardwolf Vacuum Tube Lifter', margin_left, bottom_y, drw * 4, true, 0);

    bottom_y -= drw * 4.9;
    drawTxt('The above drawing is based on information provided by the buyer. The Aardwolf vacuum tube lifter is', margin_left, bottom_y, font_sz, false);
    drawTxt('combined with a crane, vacuum generator, suction supply hose, lift tube, control unit and suction head', margin_left, bottom_y - drw * 4, font_sz, false);

    bottom_y -= drw * 11.6;
    if (currentWorkload) {
        drawTxt(`Lifting capacity: ${currentWorkload.maxLiftingCapacity}. (As per customer’s request). The Aardwolf Vacuum Tube Lifter is a classic`, margin_left, bottom_y, font_sz);
        drawTxt(`design typically suited for loads between ${currentWorkload.minLiftingCapacity} - ${currentWorkload.maxLiftingCapacity}.`, margin_left, bottom_y - drw * 4, font_sz);
    }

    bottom_y -= drw * 15.3;
    drawTxt('2  TECHNICAL DATA', margin_left + drw * 1.7, bottom_y, font_sz, true, 1);

    bottom_y -= drw * 2.4;
    page.drawLine({
        start: { x: margin_left, y: bottom_y },
        end: { x: drw * 210 - margin_right, y: bottom_y },
        thickness: thick,
        color: rgb(1, 0, 0),
    });

    bottom_y -= drw * 3.5;

    // Draw table border & backgrounds
    const totalRows = 7;
    const startX = margin_left;
    const endX = drw * 210 - margin_right;
    const middleX = startX + (endX - startX) / 2;
    const borderColor = rgb(0.8, 0.8, 0.8);

    for (let i = 0; i <= totalRows; i++) {
        const currentY = bottom_y - i * rowHeight;
        page.drawLine({ start: { x: middleX, y: currentY }, end: { x: endX, y: currentY }, thickness: thick, color: borderColor });
        if (i < totalRows && i !== 3) {
            page.drawRectangle({
                x: startX,
                y: currentY - rowHeight,
                width: middleX - startX,
                height: rowHeight,
                color: borderColor,
                borderWidth: 0
            });
        }
    }

    for (let i = 0; i <= totalRows; i++) {
        const currentY = bottom_y - i * rowHeight;
        page.drawLine({ start: { x: startX, y: currentY }, end: { x: middleX, y: currentY }, thickness: thick, color: rgb(1, 1, 1) });
    }

    page.drawLine({ start: { x: startX, y: bottom_y }, end: { x: startX, y: bottom_y - totalRows * rowHeight }, thickness: thick, color: borderColor });
    page.drawLine({ start: { x: middleX, y: bottom_y }, end: { x: middleX, y: bottom_y - totalRows * rowHeight }, thickness: thick, color: borderColor });
    page.drawLine({ start: { x: endX, y: bottom_y }, end: { x: endX, y: bottom_y - totalRows * rowHeight }, thickness: thick, color: borderColor });

    // Draw table content
    const labels = [
        'Maximum lifting capacity', 'Lift tube size', 'Electrical vacuum pump',
        'Vertical movement (Stroke)', '2.5m lift tube (standard)', 'Installation height',
        'Safety factor'
    ];
    const cellPadding = drw * 5;
    labels.forEach((label, index) => {
        page.drawText(label, {
            x: margin_left + drw * 2.5,
            y: bottom_y - rowHeight * index - cellPadding,
            size: 1.33 * font_sz,
            font: font_open_sans_bold,
            color: rgb(0, 0, 0)
        });
    });

    if (currentWorkload) {
        [
            { key: 'maxLiftingCapacity', y: 0 },
            { key: 'liftTubeSize', y: 1 },
            { key: 'liftTubePower', y: 2 },
            { key: 'liftTube17', y: 4 },
            { key: 'liftTube29', y: 5 },
            { key: '2.5 minimum', y: 6 }
        ].forEach(itm => {
            let s = (itm.key === 'liftTubeSize' ? 'Ø' : '') + (currentWorkload[itm.key] || '');
            if (itm.key.includes('2.5')) s = itm.key;
            page.drawText(s, {
                x: drw * 106,
                y: bottom_y - rowHeight * itm.y - cellPadding,
                size: 1.33 * font_sz,
                font: font_open_sans,
                color: rgb(0, 0, 0)
            });
        });
    }

    bottom_y = drw * 39.3;
    drawTxt('Note:', margin_left, bottom_y, font_sz, true, 1);
    drawTxt('It is recommended that the buyer purchase extra vacuum heads to cover all eventualities such as', margin_left + drw * 12, bottom_y, font_sz, false);
    drawTxt('different carton sizes and the possibility of porous materials.', margin_left + drw * 12, bottom_y - drw * 4, font_sz, false);

    bottom_y -= drw * 14.5;
    drawTxt('Quotation:', margin_left + drw * 68, bottom_y, font_sz, true, 1);
    if (userName && totalPrice) {
        drawTxt(totalPrice, margin_left + drw * 90, bottom_y, font_sz, true, 0);
    }

    page.drawImage(logoImage, {
        x: drw * 149,
        y: drw * (297 - 17 - 6),
        width: 36 * drw,
        height: 9 * drw
    });

    if (onProgress) onProgress(70);

    // Draw SVG components
    if (pdfContent && sceneData) {
        const svgSaver = {
            data: sceneData,
            drw,
            page,
            svgFiles: pdfContent,
            margin_left,
            margin_right,
            thick,
            font_open_sans,
            selectedUnit,
            zoomft
        };
        const svg = new SvgDrawCls(svgSaver, margin_left, 155 * drw, 210 * drw - (margin_right + margin_left) - 5 * drw, 100 * drw);
        await svg.drawSvg();
    }

    if (onProgress) onProgress(90);

    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFileName || 'vector_document.pdf';
    a.click();
    URL.revokeObjectURL(url);

    if (onProgress) onProgress(100);
}
