// ============================================================================
//  MANAGER LIST — one entry per person, kept across seasons.
//
//  "aba"    ABA account number shown in the standings (leave "" if none).
//  "teams"  the person's FPL team for each season. FPL gives everyone a new
//           team ID every season, so add a line per season, e.g.
//             "2027-28": { "id": 1234567, "team": "Team name", "leagues": ["389585"] }
//           Their ABA number and club badge then carry over automatically.
//
//  Keep everything between the outer brackets as plain JSON (double quotes,
//  no comments inside).
// ============================================================================
window.FPL_MANAGERS = [
  { "name": "Seyha ly", "aba": "085 897 968",
    "teams": { "2026-27": { "id": 2019453, "team": "The Red Devil", "leagues": ["389585", "390100"] } } },
  { "name": "នរ សិង្ហ កន្សៃ", "aba": "000 790 069",
    "teams": { "2026-27": { "id": 2023013, "team": "G.O.A.T", "leagues": ["389585"] } } },
  { "name": "Piseth Nhim", "aba": "007 043 391",
    "teams": { "2026-27": { "id": 2026160, "team": "DESSTRo", "leagues": ["389585"] } } },
  { "name": "Monor Noem", "aba": "001 335 048",
    "teams": { "2026-27": { "id": 2023789, "team": "NORA FC", "leagues": ["389585"] } } },
  { "name": "Vibol Dang", "aba": "077 767 949",
    "teams": { "2026-27": { "id": 2024611, "team": "The White Emperor", "leagues": ["389585"] } } },
  { "name": "Kun Phaktra", "aba": "002 157 778",
    "teams": { "2026-27": { "id": 2067578, "team": "The Blue Warriors", "leagues": ["389585"] } } },
  { "name": "Bora Chhe", "aba": "000 971 427",
    "teams": { "2026-27": { "id": 2026484, "team": "Bora's Team", "leagues": ["389585"] } } },
  { "name": "Hokheng Ker", "aba": "",
    "teams": { "2026-27": { "id": 145847, "team": "Undefeated", "leagues": ["390100"] } } }
];
