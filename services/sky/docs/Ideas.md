Ideas

SKY

FRONTEND
1. Zoom on the interesting area:
    - Click Zoom in the right side bar
    - Drag the frame right on the sky
    - when Button is released, the chosen part of the sky with interesting object(s) marked is shown in Aladin view dialog

2. Keep the connection to jpl kafka and show objects emerging there immediately on the sky
3. Put all windows into some order (from the very beginning). It must be a site with interrelated components, not just gathering of occasional widgets
4. Think out about mechanism to show more info about stars and DSO on sky-card
5. Fix a bug with IDs for stars
6. Add correct humanized interpretation of GCN events


BACKEND
1. Scoring mechanism: External, Risk, Urgency models
2. Add more sources 
3. Implement stats for what we are getting (think about cumulative stats)
4. Add support of Location through all modules and scripts
5. For stats - create a script gathering every day alerts_now into archive.json
6. Parse GCN into some human-readable format (check if we can get more info from url given in json?)

---
WEATHER
1. Check if there are such kafka servers like in jpl to get weather online
2. Cloud mapping algorithm
3. Revise scoring for astronomical weather for different profiles
4. Improve UI

----
NEWS
1. Display news on Aladin sky map

----
REFACTORING
1. Move finally all library code into library, all constants into yml, all rules into yml add descriptions, stop recopying the code, start re-distributing it among modules and scripts

------------
ADMINISTRATION
1. Try GitHUB issues to track tasks


----
AI:
- Claude: 22.14 EUR | 100-200 EUR per month
- Cursor: 90 PLN (21.30 EUR) | 280 (66.20 EUR) PLN per month
- ChatGPT 26.40 USD (22.31 EUR) 
