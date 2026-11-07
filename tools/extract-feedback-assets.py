"""Extract approved source imagery without modifying the source workbooks."""
from pathlib import Path
import json
import shutil
import openpyxl

root = Path(__file__).resolve().parents[1]
out = root / 'public/assets/configurator'
out.mkdir(parents=True, exist_ok=True)
sources = []

def extract(filename, sheet, mapping):
    ws = openpyxl.load_workbook(root / 'ref' / filename, data_only=True)[sheet]
    for image in ws._images:
        cell = (image.anchor._from.row + 1, image.anchor._from.col + 1)
        if cell not in mapping:
            continue
        target = mapping[cell] + '.' + image.format
        (out / target).write_bytes(image._data())
        sources.append({'image': target, 'workbook': filename, 'sheet': sheet, 'anchor': cell})

extract('1. BANG CHON APP 21 OCT.xlsx', 'Sheet1', {
    (3, 5): 'crane-floor', (3, 9): 'crane-mobile', (3, 11): 'crane-wall',
    (3, 6): 'jib', (3, 14): 'handle-mhc', (3, 15): 'handle-cf2',
    (3, 16): 'handle-ethv3', (3, 17): 'handle-ethv2',
})
extract('SUCTION CUP TABLE latest 13-OCT 2.xlsx', 'suction pad .new', {
    (7, 1): 'pad-1x-bellows', (10, 1): 'pad-2x-bellows',
    (15, 1): 'pad-4x-bellows', (17, 1): 'pad-6x-bellows',
    (19, 1): 'pad-oval', (22, 1): 'pad-2x-rectangular',
    (23, 1): 'pad-inline', (24, 1): 'pad-frame', (25, 1): 'pad-matrix',
    (27, 1): 'pad-flat', (33, 1): 'pad-rectangular-flat',
})
feedback = Path(r'C:\Users\nguyenbuu.DESKTOP-TOEFTR1\Downloads\app-feedback_20261031 (1)\Visuals\Heads')
for source, target in [('One Hand.webp', 'handle-mhc.webp'), ('Comfort Grib.webp', 'handle-cf2.webp'), ('long reach.webp', 'handle-ethv3.webp'), ('high reach.webp', 'handle-ethv2.webp')]:
    shutil.copyfile(feedback / source, out / target)
    sources.append({'image': target, 'source': 'Client Visuals/Heads/' + source})
(out / 'sources.json').write_text(json.dumps(sources, indent=2), encoding='utf8')
print('Extracted', len(sources), 'source images')
