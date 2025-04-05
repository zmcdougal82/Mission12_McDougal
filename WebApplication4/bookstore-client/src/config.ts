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
// The route definition in staticwebapp.config.json handles the redirection to the actual backend
export const API_URL = '/api';
console.log('API URL:', API_URL);
