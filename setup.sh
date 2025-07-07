#!/bin/bash

# Stop any running Node processes
pkill -f node

# Clean up frontend
cd frontend
rm -rf node_modules dist package-lock.json
npm install

# Clean up backend
cd ../backend
rm -rf node_modules dist package-lock.json
npm install

# Start the application
echo "Setup complete! To start the application:"
echo "1. Start the backend: cd backend && npm run dev"
echo "2. Start the frontend: cd frontend && npm run dev"
echo "3. Access the application at http://localhost:5173" 