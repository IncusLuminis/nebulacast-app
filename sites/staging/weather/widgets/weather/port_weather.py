#!/usr/bin/env python3
import re

# Read original file
with open('../../../../assets/js/widget_weather_poc.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove IIFE wrapper
content = re.sub(r'^\(function\(\)\{[\r\n]+"use strict";[\r\n]+', '', content)
content = re.sub(r'[\r\n]+\}\(\)\);?\s*$', '', content)

# Remove weatherCard initialization
content = re.sub(r'const weatherCard = document\.getElementById\("poc-weather"\);[\r\n]+', '', content)

# Replace weatherCard references with rootEl
content = re.sub(r'weatherCard\?\.querySelector', 'rootEl?.querySelector', content)
content = re.sub(r'weatherCard\.querySelector', 'rootEl.querySelector', content)

# Remove initWeatherWidget initialization calls
content = re.sub(r'if \(document\.readyState === "loading"\) document\.addEventListener\("DOMContentLoaded", initWeatherWidget\);[\r\n]+else initWeatherWidget\(\);', '', content)

# Write ported content
with open('weather_ported.js', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Ported file created: {len(content)} characters')
