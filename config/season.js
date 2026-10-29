// ============================================================================
//  SEASON SETTINGS — the one place to edit when a new FPL season starts.
//
//  New season checklist:
//    1. "season"            -> e.g. "2027-28"
//    2. "leagues"           -> the renewed league's ID, name and join code
//    3. "weeklyStake"       -> amount each weekly winner collects
//    4. "chipSetOneLastGw"  -> last gameweek the first set of chips can be used
//  Then add everyone's new FPL team ID in config/managers.js.
//
//  "seasonViewerReady" stays false until the season switcher (plan step 3,
//  part B) is built; while false, a reminder appears in the app at the final
//  gameweek.
//
//  Keep everything between the outer braces as plain JSON (double quotes,
//  no comments inside) — the GitHub sync script reads this file too.
// ============================================================================
window.FPL_SEASON = {
  "season": "2026-27",
  "totalGameweeks": 38,
  "weeklyStake": 3,
  "chipSetOneLastGw": 19,
  "mainLeague": "389585",
  "seasonViewerReady": false,
  "leagues": [
    { "id": "389585", "name": "Clash of Elite 2026-2027", "joinCode": "8d70fl" },
    { "id": "390100", "name": "Fantasy with Heng", "joinCode": "0m27ty" }
  ]
};
