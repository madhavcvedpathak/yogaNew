#!/usr/bin/env bash
# Exit on error
set -o errexit

# Debug: Check Python environment
echo "Python version:"
python --version
echo "Pip version:"
pip --version

# Build the frontend
npm install
npm run build

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
