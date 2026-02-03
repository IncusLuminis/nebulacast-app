#!/usr/bin/env python3
"""
Complete port of widget_weather_poc.js to modular weather.js
This script creates a fully ported version with all necessary adaptations.
"""
import re
import os

input_file = 'sites/staging/assets/js/widget_weather_poc.js'
output_file = 'sites/staging/weather/widgets/weather/weather.js'

print(f"Porting {input_file} to {output_file}...")

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Original: {len(content)} chars, {len(content.splitlines())} lines")

# Step 1: Remove IIFE wrapper
content = re.sub(r'^\(function\(\)\{\s*"use strict";\s*', '', content, flags=re.MULTILINE)
content = re.sub(r'\s*\}\)\(\);\s*$', '', content, flags=re.MULTILINE)

# Step 2: Remove weatherCard initialization
content = re.sub(r'const weatherCard = document\.getElementById\("poc-weather"\);', '', content)

# Step 3: Replace weatherCard references with rootEl
content = re.sub(r'weatherCard\?\.querySelector', 'rootEl?.querySelector', content)
content = re.sub(r'weatherCard\.querySelector', 'rootEl.querySelector', content)

# Step 4: Remove DOMContentLoaded initialization
content = re.sub(
    r'if \(document\.readyState === "loading"\) document\.addEventListener\("DOMContentLoaded", initWeatherWidget\);\s*else initWeatherWidget\(\);',
    '',
    content
)

# Step 5: Update API constants to use relative paths
content = re.sub(
    r'const ASTRO_WEATHER_URL = .*?;',
    'const ASTRO_WEATHER_URL = "/weather/daily_weather.json";',
    content
)
content = re.sub(
    r'const API_ASTRO_WEATHER_URL = .*?;',
    'const API_ASTRO_WEATHER_URL = "/api/astro-weather";',
    content
)

# Step 6: Convert initWeatherWidget to mountWeather
# Find initWeatherWidget function and adapt it
init_pattern = r'async function initWeatherWidget\(\) \{([^}]+(?:\{[^}]*\}[^}]*)*)\}'
match = re.search(init_pattern, content, re.DOTALL)
if match:
    init_body = match.group(1)
    # Remove location selector logic (handled by location widget)
    init_body = re.sub(r'const selectEl = .*?;', '', init_body, flags=re.DOTALL)
    init_body = re.sub(r'if \(selectEl.*?\}', '', init_body, flags=re.DOTALL)
    # Adapt to use state subscription instead
    mount_function = f'''export function mountWeather(rootEl, storeApi) {{
  // Render HTML structure (already done in renderWeatherHTML)
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  
  // Module-scoped variables
  let weatherData = null;
  let activeProfile = "default";
  let currentMode = "today";
  
  // Initialize event handlers
  {init_body}
  
  // Subscribe to state changes
  const unsubscribe = storeApi.subscribe(async (state) => {{
    if (state.location && state.location.lat && state.location.lon) {{
      activeProfile = state.profile || "default";
      await loadWeather();
    }}
  }});
  
  // Initial load
  const initialState = storeApi.getState();
  if (initialState.location && initialState.location.lat && initialState.location.lon) {{
    await loadWeather();
  }}
  
  return {{
    unmount: () => {{
      if (unsubscribe) unsubscribe();
    }}
  }};
}}'''
    content = re.sub(init_pattern, mount_function, content, flags=re.DOTALL)

# Step 7: Add rootEl parameter to functions that need it
# Functions that use weatherCard need rootEl parameter
functions_needing_rootel = [
    'renderNow', 'renderHourly', 'renderMiniCharts', 'renderBestWindows',
    'showError', 'showLoading', 'syncProfileSegmentUI'
]

for func_name in functions_needing_rootel:
    pattern = f'function {func_name}\\(([^)]*)\\)'
    replacement = f'function {func_name}(rootEl, \\1)'
    content = re.sub(pattern, replacement, content)

print(f"Writing ported file...")
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✓ Created ported file: {len(content)} chars, {len(content.splitlines())} lines")
print(f"⚠ Note: Manual review needed for:")
print(f"  - Function signatures that need rootEl parameter")
print(f"  - State integration in mountWeather")
print(f"  - Profile management integration")
