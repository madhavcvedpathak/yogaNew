#!/usr/bin/env bash
# Exit on error
set -o errexit

# Build the frontend
npm install
npm run build

# Install Python dependencies
pip install -r requirements.txt
