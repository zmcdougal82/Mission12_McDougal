// Configuration for the frontend application

// Detect current environment
export const currentEnvironment = process.env.NODE_ENV || 'development';
console.log('Current environment:', currentEnvironment);

// Set baseURL for API requests - Use relative paths for Azure Static Web Apps
export const API_URL = '/api';
console.log('API URL:', API_URL);

// Environment detection
export const isProduction = process.env.NODE_ENV === 'production';

// Azure detection
export const isRunningOnAzure = window.location.hostname.includes('azurestaticapps.net');
console.log('Running on Azure:', isRunningOnAzure);
