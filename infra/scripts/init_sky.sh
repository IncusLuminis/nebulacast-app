#!/usr/bin/env bash

set -e

echo "▶ Initializing SKY widget structure..."

# --- Backend: services/sky ---
echo "• Creating services/sky structure"

mkdir -p services/sky/pipelines
mkdir -p services/sky/outputs
mkdir -p services/sky/configs
mkdir -p services/sky/data/raw
mkdir -p services/sky/data/generated
mkdir -p services/sky/tests

touch services/sky/pipelines/run_sky.py
touch services/sky/README.md
touch services/sky/requirements.txt

# --- Site: sites/staging/sky ---
echo "• Creating sites/staging/sky structure"

mkdir -p sites/staging/sky/data
mkdir -p sites/staging/sky/objects
mkdir -p sites/staging/sky/alerts
mkdir -p sites/staging/sky/core
mkdir -p sites/staging/sky/widgets
mkdir -p sites/staging/sky/assets

touch sites/staging/sky/index.html
touch sites/staging/sky/widget.js

# --- Marker files ---
touch sites/staging/sky/data/.gitkeep
touch sites/staging/sky/objects/.gitkeep
touch sites/staging/sky/alerts/.gitkeep

echo "✅ SKY widget folders created successfully."