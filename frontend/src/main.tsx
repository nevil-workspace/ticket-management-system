import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import axios from 'axios';
import { GoogleOAuthProvider } from '@react-oauth/google';

axios.defaults.baseURL = process.env.VITE_API_URL || 'http://localhost:3000';
axios.defaults.headers.common['Content-Type'] = 'application/json';

console.log('Setting default axios url: ', axios.defaults.baseURL);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
