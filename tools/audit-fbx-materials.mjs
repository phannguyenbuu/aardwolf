import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const output = process.argv[2];
if (!output || !path.isAbsolute(output)) throw Error('Pass an absolute output directory');
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.route('**/material-audit', r => r.fulfill({ contentType: 'text/html', body: '<html></html>' }));
await page.route('**/models/**', route => {
    const file = path.resolve('.' + decodeURIComponent(new URL(route.request().url()).pathname));
    if (!file.startsWith(path.resolve('models') + path.sep) || !fs.existsSync(file)) return route.abort();
    return route.fulfill({ body: fs.readFileSync(file) });
});
await page.goto('http://localhost:3000/material-audit');
const catalog = await page.evaluate(async () => {
    const { ALL_PRELOAD_ITEMS } = await import('/src/constants/data.js');
    return ALL_PRELOAD_ITEMS.map(item => ({ name: item.name, file: item.file || `/models/aardwolf_all_part_${item.name}.fbx` }));
});
const settings = await page.evaluate(async () => {
    const { migrateSceneSettings } = await import('/src/utils/sceneSettings.js');
    const response = await fetch('/api/settings');
    if (!response.ok) throw Error('Settings HTTP ' + response.status);
    const document = await response.json();
    return { updatedAt: document.updatedAt, ...migrateSceneSettings(document) };
}).catch(error => ({ error: error.message }));
const report = { generatedAt: new Date().toISOString(), scope: 'Top-level models/*.fbx; catalog membership is not proof an asset is selected by current rules', settingsUpdatedAt: settings.updatedAt, settingsError: settings.error, files: [] };
for (const filename of fs.readdirSync('models').filter(n => /\.fbx$/i.test(n)).sort()) {
    const refs = catalog.filter(item => decodeURIComponent(item.file) === '/models/' + filename);
    const record = await page.evaluate(async ({ filename, refs, settings }) => {
        const { FBXLoader } = await import('/node_modules/three/examples/jsm/loaders/FBXLoader.js');
        const { resolveMaterial } = await import('/src/utils/sceneSettings.js');
        const warnings = [];
        const warn = console.warn;
        console.warn = (...args) => warnings.push(args.join(' '));
        try {
            const model = new FBXLoader().parse(await (await fetch('/models/' + encodeURIComponent(filename))).arrayBuffer(), '/models/');
            const materials = [], meshes = [];
            const ids = new Map();
            const texture = t => t ? { name: t.name, source: t.source?.data?.currentSrc || t.source?.data?.src || null, colorSpace: t.colorSpace, channel: t.channel, repeat: t.repeat.toArray(), offset: t.offset.toArray(), rotation: t.rotation } : null;
            let index = 0;
            model.traverse(mesh => {
                if (!mesh.isMesh) return;
                const slots = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map(material => {
                    if (!ids.has(material.uuid)) {
                        ids.set(material.uuid, materials.length);
                        const entry = { id: materials.length, name: material.name, type: material.type,
                            color: material.color ? '#' + material.color.getHexString() : null,
                            colorLinear: material.color?.toArray(), emissive: material.emissive ? '#' + material.emissive.getHexString() : null,
                            opacity: material.opacity, transparent: material.transparent, alphaTest: material.alphaTest,
                            side: material.side, vertexColors: material.vertexColors, shininess: material.shininess ?? null,
                            roughness: material.roughness ?? null, metalness: material.metalness ?? null,
                            transmission: material.transmission ?? null, ior: material.ior ?? null,
                            specular: material.specular ? '#' + material.specular.getHexString() : null,
                            maps: {} };
                        for (const key of ['map','normalMap','bumpMap','roughnessMap','metalnessMap','alphaMap','emissiveMap','aoMap','specularMap']) entry.maps[key] = texture(material[key]);
                        materials.push(entry);
                    }
                    return ids.get(material.uuid);
                });
                const name = refs[0]?.name;
                const part = /tube/i.test(name || filename) ? 'tube' : /pump/i.test(name || filename) ? 'pump' : /crane/i.test(name || filename) ? 'crane' : /grip|reach|hand|stack|control|ethv|mhc|cf2/i.test(name || filename) ? 'head' : 'suction';
                const mappedId = name && settings.mapping ? resolveMaterial(settings.mapping, part, name, index) : null;
                meshes.push({ index: index++, name: mesh.name, slots, vertices: mesh.geometry.attributes.position.count,
                    uv: !!mesh.geometry.attributes.uv, groups: mesh.geometry.groups,
                    app: { inferredPart: part, modelName: name || null, materialId: mappedId, properties: mappedId ? settings.materials?.[mappedId] : null } });
            });
            return { filename, catalog: refs, catalogued: refs.length > 0, materials, meshes, warnings: [...new Set(warnings)] };
        } catch (error) { return { filename, catalog: refs, error: error.message }; }
        finally { console.warn = warn; }
    }, { filename, refs, settings });
    report.files.push(record);
    console.log(filename, record.error || `${record.meshes.length} meshes / ${record.materials.length} materials`);
}
await browser.close();
fs.writeFileSync(path.join(output, 'fbx-materials.json'), JSON.stringify(report, null, 2));
const escape = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
const rows = [['file','catalogued','material','type','color_sRGB','roughness','metalness','shininess','opacity','transparent','texture','mesh_count']];
for (const f of report.files) for (const m of f.materials || []) rows.push([f.filename,f.catalogued,m.name,m.type,m.color,m.roughness,m.metalness,m.shininess,m.opacity,m.transparent,m.maps.map?.source || m.maps.map?.name,f.meshes.filter(mesh=>mesh.slots.includes(m.id)).length]);
fs.writeFileSync(path.join(output,'fbx-materials.csv'),'\ufeff'+rows.map(row=>row.map(escape).join(',')).join('\n'));
const files = report.files;
const md = ['# Thống kê vật liệu FBX', '', `Quét lúc ${report.generatedAt}. Tổng ${files.length} FBX; ${files.filter(f=>f.catalogued).length} file thuộc catalog app; ${files.filter(f=>f.error).length} file lỗi.`, '',
'Đọc bằng cùng Three.js FBXLoader của app. Giá trị null nghĩa là FBXLoader không cung cấp, không phải roughness/metalness bằng 0. Màu hex là sRGB; JSON lưu thêm màu linear. Material Phong không xác định được kính/kim loại/da chỉ dựa vào tên hoặc màu. Cảnh báo loader về 3dsMax texture không hỗ trợ được giữ trong JSON.', '',
'Vật liệu app được resolve từ settings dùng bởi local proxy tại thời điểm quét, gồm migration originalSurfaces. JSON lưu từng mesh → material slot → app material ID/properties. Part được suy luận theo tên; cần đối chiếu rule cho các tên không rõ. File có trong catalog có thể là lựa chọn dự phòng, không đồng nghĩa đang dùng trong scene hiện tại. File ngoài catalog không bị kết luận là có thể xóa.', '',
'CSV: mỗi hàng một material/file. JSON: đầy đủ thuộc tính, UV, group, texture và app overrides. Texture source là tham chiếu, chưa xác nhận tải thành công.', '', '| FBX | Catalog | Mesh | Material | Màu gốc | Texture màu |', '|---|---:|---:|---:|---|---|'];
for (const f of files) md.push(`| ${f.filename} | ${f.catalogued?'Có':'Không'} | ${f.meshes?.length ?? 'Lỗi'} | ${f.materials?.length ?? '-'} | ${[...new Set(f.materials?.map(m=>m.color))].join(', ')} | ${f.materials?.filter(m=>m.maps.map).length ?? 0} |`);
for (const f of files.filter(f=>f.catalogued && !f.error)) {
    md.push('', `## ${f.filename}`, '', '| Vật liệu | Kiểu | Màu | Shininess | Roughness | Metalness | Opacity | Texture |', '|---|---|---|---:|---:|---:|---:|---|');
    for (const m of f.materials) md.push(`| ${m.name.replaceAll('|','/')} | ${m.type} | ${m.color} | ${m.shininess ?? 'N/A'} | ${m.roughness ?? 'N/A'} | ${m.metalness ?? 'N/A'} | ${m.opacity} | ${m.maps.map?.name || (m.maps.map?'Có':'Không')} |`);
}
fs.writeFileSync(path.join(output,'fbx-materials.md'),md.join('\n'));
console.log(JSON.stringify({total:files.length,catalogued:files.filter(f=>f.catalogued).length,errors:files.filter(f=>f.error).length,output}));
