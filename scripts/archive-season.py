#!/usr/bin/env python3
"""
Keep a permanent record of the season, one finished gameweek at a time.

FPL wipes the previous season's data when a new season opens (around July),
so this saves everything the dashboard needs to show a past season into
archive/<season>/ while it is still available:

  archive/2026-27/season.json   season details, rules, leagues, managers, clubs, months
  archive/2026-27/gw-08.json    one file per finished gameweek: league scores, hits,
                                transfers, bench/captain points, chips, every squad,
                                player points and breakdowns, transfers made, fixtures

A gameweek is saved once FPL marks it finished and its data checked (bonus final).
Saved gameweeks are refreshed on later runs only while the data still belongs to the
same season, so FPL corrections are picked up but a new season never overwrites an
old one.

Runs after scripts/sync-fpl-data.py (it reads live_data.json) in the GitHub Action.
"""
import json
import os
import sys
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIVE_DATA_PATH = os.path.join(BASE_DIR, 'live_data.json')
ARCHIVE_ROOT = os.path.join(BASE_DIR, 'archive')
USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'


def read_js_object(path, var_name):
    """The JSON object assigned in a config file like `window.FPL_SEASON = {...};`."""
    with open(path, encoding='utf-8') as f:
        text = f.read()
    return json.loads(text[text.index('=', text.index(var_name)) + 1:].strip().rstrip(';'))


def fetch_json(url, timeout=20):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"  ⚠️ Could not fetch {url}: {e}")
        return None


def season_of(event_statuses):
    """'2026-27' from GW1's deadline (the season starts in August of the first year)."""
    gw1 = event_statuses.get('1') or {}
    deadline = gw1.get('deadline_time') or ''
    if len(deadline) < 4:
        return None
    year = int(deadline[:4])
    return f"{year}-{(year + 1) % 100:02d}"


def write_if_changed(path, data):
    """Write JSON only when the content differs (keeps git history quiet)."""
    text = json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True)
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            if f.read() == text:
                return False
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    return True


def main():
    season_cfg = read_js_object(os.path.join(BASE_DIR, 'config', 'season.js'), 'window.FPL_SEASON')
    people = read_js_object(os.path.join(BASE_DIR, 'config', 'managers.js'), 'window.FPL_MANAGERS')
    season = season_cfg.get('season')

    with open(LIVE_DATA_PATH, encoding='utf-8') as f:
        live = json.load(f)
    statuses = live.get('eventStatuses') or {}

    # Never let a new FPL season write into the folder of the season in the settings
    data_season = season_of(statuses)
    if not season or not data_season:
        print("⚠️ Archive skipped: season unknown")
        return 0
    if data_season != season:
        print(f"⚠️ Archive skipped: FPL data is for {data_season} but config/season.js says {season}. "
              f"Update the season settings for the new season first.")
        return 0

    folder = os.path.join(ARCHIVE_ROOT, season)
    os.makedirs(folder, exist_ok=True)

    leagues = live.get('leagues') or {}
    players = live.get('players') or {}
    finished = sorted(int(gw) for gw, s in statuses.items() if s.get('finished') and s.get('data_checked'))

    changed = []
    for gw in finished:
        key = str(gw)
        squads = {}
        for entry_id, by_gw in (live.get('squadPicks') or {}).items():
            if key in by_gw:
                squads[entry_id] = by_gw[key]
        if not squads:
            continue  # nothing to save for this gameweek (e.g. data not loaded)

        # Player details for everyone picked, so squads can be shown later without FPL
        picked = {str(p['element']) for s in squads.values() for p in (s.get('picks') or [])}
        player_info = {}
        for pid in picked:
            p = players.get(pid) or {}
            player_info[pid] = {k: p.get(k) for k in ('web_name', 'first_name', 'second_name', 'element_type', 'team', 'team_name', 'team_id', 'code') if k in p}

        # Fixtures: use the sync's copy if it is this gameweek's, otherwise ask FPL
        fixtures = [fx for fx in (live.get('fixtures') or []) if fx.get('event') == gw]
        existing_path = os.path.join(folder, f"gw-{gw:02d}.json")
        if not fixtures and os.path.exists(existing_path):
            with open(existing_path, encoding='utf-8') as f:
                fixtures = (json.load(f) or {}).get('fixtures') or []
        if not fixtures:
            fixtures = fetch_json(f"https://fantasy.premierleague.com/api/fixtures/?event={gw}") or []

        league_rows = {}
        for lid, league in leagues.items():
            row = next((g for g in (league.get('gameweeks') or []) if g.get('gw') == gw), None)
            if row:
                league_rows[lid] = row

        transfers = {}
        for entry_id, items in (live.get('transfersHistory') or {}).items():
            made = [t for t in (items or []) if t.get('event') == gw]
            if made:
                transfers[entry_id] = made

        record = {
            'season': season,
            'gw': gw,
            'deadline': (statuses.get(key) or {}).get('deadline_time'),
            'leagues': league_rows,
            'squads': squads,
            'players': player_info,
            'playerPoints': (live.get('playerGwPoints') or {}).get(key) or {},
            'pointsBreakdown': (live.get('playerGwExplain') or {}).get(key) or {},
            'transfers': transfers,
            'fixtures': fixtures,
        }
        if write_if_changed(existing_path, record):
            changed.append(gw)

    saved = sorted(int(n[3:5]) for n in os.listdir(folder) if n.startswith('gw-') and n.endswith('.json'))
    summary = {
        'season': season,
        'rules': {k: season_cfg.get(k) for k in ('weeklyStake', 'chipSetOneLastGw', 'totalGameweeks')},
        'leagues': {lid: {
            'name': l.get('leagueName'),
            'managers': l.get('managers'),
            'months': l.get('months'),
        } for lid, l in leagues.items()},
        'people': people,
        'clubs': live.get('teams') or {},
        'gameweeksSaved': saved,
        'complete': len(saved) >= int(season_cfg.get('totalGameweeks') or 38),
    }
    if write_if_changed(os.path.join(folder, 'season.json'), summary):
        changed.append('season')

    if changed:
        print(f"🗄️ Archive {season}: updated {', '.join(str(c) for c in changed)}; {len(saved)} gameweeks saved")
    else:
        print(f"🗄️ Archive {season}: up to date ({len(saved)} gameweeks saved)")
    return 0


if __name__ == '__main__':
    sys.exit(main())
