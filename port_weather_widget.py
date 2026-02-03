#!/usr/bin/env python3
"""Port widget_weather_poc.js to modular weather.js"""
import re

input_file = 'sites/staging/assets/js/widget_weather_poc.js'
output_file = 'sites/staging/weather/widgets/weather/weather_ported.js'

print(f"Reading {input_file}...")
with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Original: {len(content)} chars, {len(content.splitlines())} lines")

# Remove IIFE wrapper
content = re.sub(r'^\(function\(\)\{\s*"use strict";\s*', '', content, flags=re.MULTILINE)
content = re.sub(r'\s*\}\)\(\);\s*$', '', content, flags=re.MULTILINE)

# Remove weatherCard initialization
content = re.sub(r'const weatherCard = document\.getElementById\("poc-weather"\);', '', content)

# Replace weatherCard references with rootEl
content = re.sub(r'weatherCard\?\.querySelector', 'rootEl?.querySelector', content)
content = re.sub(r'weatherCard\.querySelector', 'rootEl.querySelector', content)

# Remove init calls
content = re.sub(r'if \(document\.readyState === "loading"\) document\.addEventListener\("DOMContentLoaded", initWeatherWidget\);\s*else initWeatherWidget\(\);', '', content)

print(f"Writing {output_file}...")
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Created: {len(content)} chars, {len(content.splitlines())} lines")
