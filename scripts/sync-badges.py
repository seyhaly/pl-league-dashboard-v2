#!/usr/bin/env python3
"""
Download each manager's FPL club badge and save a small copy in badges/.

FPL serves badges as ~1 MB PNGs without CORS headers, so the page can't use
them in exported images. This keeps 128px copies next to the site and an
index (badges/index.json) mapping entry id -> file. Only badges whose FPL
source URL changed are downloaded again.

Resizing uses Pillow when available (GitHub Actions installs it), otherwise
macOS `sips`, otherwise the original image is kept.
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIVE_DATA_PATH = os.path.join(BASE_DIR, 'live_data.json')
BADGE_DIR = os.path.join(BASE_DIR, 'badges')
INDEX_PATH = os.path.join(BADGE_DIR, 'index.json')
BADGE_SIZE = 128
USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'


def fetch(url, timeout=15):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def resize_png(src_path, dest_path):
    try:
        from PIL import Image
        with Image.open(src_path) as img:
            img = img.convert('RGBA')
            img.thumbnail((BADGE_SIZE, BADGE_SIZE), Image.LANCZOS)
            img.save(dest_path, 'PNG', optimize=True)
        return
    except ImportError:
        pass

    if shutil.which('sips'):
        subprocess.run(['sips', '-s', 'format', 'png', '-Z', str(BADGE_SIZE), src_path, '--out', dest_path],
                       check=True, capture_output=True)
        return

    print('  ⚠️ No image resizer available; keeping full-size badge.')
    shutil.copyfile(src_path, dest_path)


def manager_ids():
    with open(LIVE_DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    ids = set()
    for league in (data.get('leagues') or {}).values():
        for m in league.get('managers') or []:
            if m.get('id'):
                ids.add(int(m['id']))
    return sorted(ids)


def main():
    os.makedirs(BADGE_DIR, exist_ok=True)
    try:
        with open(INDEX_PATH, 'r', encoding='utf-8') as f:
            index = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        index = {}

    ids = manager_ids()
    if not ids:
        # No managers in this run's data (e.g. FPL didn't answer): keep the badges we have
        print('⚠️ No managers found in live_data.json; badge index left unchanged.')
        return 0

    new_index = {}
    for entry_id in ids:
        key = str(entry_id)
        file_name = f'{entry_id}.png'
        file_path = os.path.join(BADGE_DIR, file_name)
        try:
            entry = json.loads(fetch(f'https://fantasy.premierleague.com/api/entry/{entry_id}/'))
        except Exception as e:
            print(f'  ⚠️ Could not fetch entry {entry_id}: {e}; keeping previous badge')
            if key in index:
                new_index[key] = index[key]
            continue

        src = entry.get('club_badge_src')
        if not src:
            if os.path.exists(file_path):
                os.remove(file_path)
            print(f'  – {entry_id} ({entry.get("name")}): no badge')
            continue

        version = hashlib.sha1(src.encode('utf-8')).hexdigest()[:10]
        previous = index.get(key)
        if previous and previous.get('src') == src and os.path.exists(file_path):
            new_index[key] = previous
            continue

        try:
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                tmp.write(fetch(src, timeout=30))
                tmp_path = tmp.name
            resize_png(tmp_path, file_path)
            os.remove(tmp_path)
        except Exception as e:
            print(f'  ⚠️ Could not download badge for {entry_id}: {e}')
            if previous:
                new_index[key] = previous
            continue

        new_index[key] = {'src': src, 'file': f'badges/{file_name}', 'v': version}
        print(f'  ✓ {entry_id} ({entry.get("name")}): badge saved')

    if new_index != index:
        with open(INDEX_PATH, 'w', encoding='utf-8') as f:
            json.dump(new_index, f, indent=2, sort_keys=True)
            f.write('\n')
        print(f'✅ Badge index updated ({len(new_index)} badges).')
    else:
        print('✅ Badges unchanged.')


if __name__ == '__main__':
    sys.exit(main())
