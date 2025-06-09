# CertiFi Setup Guide

## Prerequisites

1. Install DFX (Internet Computer SDK)
2. Install Node.js (v16 or later)
3. Install npm or yarn

## Local Development Setup

1. Start the local Internet Computer network:
   ```bash
   dfx start --clean --background
   ```

2. Deploy the backend canister:
   ```bash
   dfx deploy certifi_backend
   ```

3. Update the frontend environment:
   - Get the backend canister ID:
     ```bash
     dfx canister id certifi_backend
     ```
   - Update `frontend/.env` with the canister ID:
     ```
     REACT_APP_BACKEND_CANISTER_ID=<your-canister-id>
     REACT_APP_DFX_NETWORK=local
     REACT_APP_IC_HOST=http://localhost:8000
     REACT_APP_II_URL=http://localhost:4943
     ```

4. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

5. Start the frontend development server:
   ```bash
   npm start
   ```

## Deployment to Internet Computer

1. Update `frontend/.env` for production:
   ```
   REACT_APP_DFX_NETWORK=ic
   REACT_APP_IC_HOST=https://ic0.app
   REACT_APP_II_URL=https://identity.ic0.app
   ```

2. Deploy to the Internet Computer:
   ```bash
   dfx deploy --network=ic
   ```

## Project Structure

- `/backend` - Motoko backend canister code
- `/frontend` - React frontend application
- `/declarations` - Auto-generated canister interfaces
- `/dfx.json` - DFX project configuration

## Troubleshooting

- If you see authentication issues, try clearing your browser's local storage
- Make sure the DFX server is running with `dfx start`
- Check canister status with `dfx canister status <canister-name>`
- View canister logs with `dfx canister logs <canister-name>`
