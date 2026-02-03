#!/usr/bin/env python3
"""Helper script to port widget_weather_poc.js to modular weather.js"""

import re

def port_file(input_path, output_path):
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove IIFE wrapper
    content = re.sub(r'^\(function\(\)\{[\r\n]+"use strict";[\r\n]+', '', content)
    content = re.sub(r'\}\(\)\);?\s*$', '', content)
    
    # Replace weatherCard references with rootEl parameter
    # First, replace direct document.getElementById calls
    content = re.sub(r'const weatherCard = document\.getElementById\("poc-weather"\);', '', content)
    
    # Replace weatherCard?.querySelector with rootEl?.querySelector
    content = re.sub(r'weatherCard\?\.querySelector', 'rootEl?.querySelector', content)
    content = re.sub(r'weatherCard\.querySelector', 'rootEl.querySelector', content)
    
    # Replace weatherCard references in function calls (need to pass rootEl)
    # This is more complex - we'll need to track which functions need rootEl
    
    # Add export for mountWeather at the end
    # Find the initWeatherWidget function and convert it to mountWeather
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    import sys
    port_file(sys.argv[1], sys.argv[2])
