"""Generate selection-card thumbnails. Requires Pillow: python -m pip install Pillow."""
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/assets/configurator'
OUTPUT = SOURCE / 'thumbs'
OUTPUT.mkdir(exist_ok=True)
manifest = {}
original_bytes = thumbnail_bytes = 0
for source in sorted(SOURCE.iterdir()):
    if source.suffix.lower() not in ('.png', '.webp'):
        continue
    target = OUTPUT / f'{source.stem}-{source.suffix[1:]}.webp'
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert('RGBA')
        image.thumbnail((400, 400), Image.Resampling.LANCZOS)
        image.save(target, 'WEBP', quality=80, method=6)
    manifest[f'/assets/configurator/{source.name}'] = f'/assets/configurator/thumbs/{target.name}'
    original_bytes += source.stat().st_size
    thumbnail_bytes += target.stat().st_size
(ROOT / 'src/constants/selectionThumbnails.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(f'{len(manifest)} thumbnails: {original_bytes:,} -> {thumbnail_bytes:,} bytes ({1-thumbnail_bytes/original_bytes:.1%} smaller)')
