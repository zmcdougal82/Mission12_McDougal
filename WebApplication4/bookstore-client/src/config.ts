// Configuration for the frontend application

// Detect current environment
export const currentEnvironment = process.env.NODE_ENV || 'development';
console.log('Current environment:', currentEnvironment);

// Environment detection
export const isProduction = process.env.NODE_ENV === 'production';

// Azure detection
export const isRunningOnAzure = window.location.hostname.includes('azurestaticapps.net');
console.log('Running on Azure:', isRunningOnAzure);

// Set baseURL for API requests
// When running on Azure, use the direct backend URL to avoid routing issues
export const API_URL = isRunningOnAzure 
  ? 'https://BookstoreMcDougalBackend.azurewebsites.net/api'
  : '/api';
console.log('API URL:', API_URL);
