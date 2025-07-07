#!/bin/bash

# Clean frontend
cd frontend
rm -rf node_modules
rm -rf dist
rm -f package-lock.json

# Clean backend
cd ../backend
rm -rf node_modules
rm -rf dist
rm -f package-lock.json

# Return to root
cd ..

# Install root dependencies
rm -rf node_modules
rm -f package-lock.json

# npm run install:all

echo "Cleanup complete!" 