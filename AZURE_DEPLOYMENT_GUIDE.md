# Azure Static Web Apps Deployment Guide

This guide outlines how this project has been optimized for deployment to Azure Static Web Apps through GitHub.

## Project Structure

The application consists of:
- **.NET 9 API backend**: Located in the `WebApplication4` folder
- **React frontend**: Located in the `WebApplication4/bookstore-client` folder

## Deployment Configuration

### GitHub Workflow

The GitHub workflow file (`.github/workflows/azure-static-web-apps-purple-dune-0bd76be0f.yml`) has been configured to:
- Target the `phase-6` branch for deployment
- Deploy the React app from `./WebApplication4/bookstore-client`
- Deploy the API from `./WebApplication4`
- Use the `build` directory as the output location for the React app

### API Configuration

The backend API has been optimized for Azure with the following changes:

1. **CORS Configuration**: 
   - Updated to allow any origin, which is necessary for the API to work with the frontend in the Azure environment

2. **Database Path Resolution**:
   - Added dynamic path resolution to ensure the SQLite database is found correctly in both development and production environments

3. **Configuration Settings**:
   - Added `"AllowedHosts": "*"` to appsettings.json for proper host header validation in Azure

### Frontend Configuration

The React frontend has been configured with:

1. **API URL**:
   - Using relative paths for API requests (`/api`) which works in both local development and Azure

2. **Azure-specific Configuration**:
   - `staticwebapp.config.json` and `routes.json` files in both source and build directories to handle routing
   - Navigation fallbacks to ensure proper SPA behavior

## Deployment Instructions

To deploy this application to Azure Static Web Apps:

1. **Create a Repository**:
   - Push this code to GitHub under a branch named `phase-6`

2. **Create Azure Static Web App**:
   - In the Azure Portal, create a new Static Web App resource
   - Link it to your GitHub repository
   - Select the `phase-6` branch
   - Use the following build settings:
     - App location: `./WebApplication4/bookstore-client`
     - API location: `./WebApplication4`
     - Output location: `build`

3. **Verify Deployment**:
   - After the GitHub Action completes, check the generated URL in the Azure Portal
   - Test the application to ensure both frontend and API are working correctly

## File Structure Considerations

- `.gitignore` has been configured to include the React build directory for Azure deployment
- SQLite database file is included in the deployment via the project file settings
- All configuration files are properly set up for Azure Static Web Apps

## Troubleshooting

- If you encounter API connection issues, check the browser console for CORS errors
- If database issues occur, refer to the DATABASE_MIGRATION.md file for guidance
- For build failures, check the GitHub Actions logs for detailed error information
