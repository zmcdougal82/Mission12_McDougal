## Database Migration Guide for Azure Static Web Apps

This document outlines how database files are handled in the Azure Static Web Apps deployment.

## Database Structure

This application uses SQLite as its database engine, with the database file located at:
```
WebApplication4/Data/BookStore.sqlite
```

## Azure Static Web Apps Configuration

For the database to work correctly in Azure Static Web Apps, the following configurations have been implemented:

1. **Connection String Configuration**: 
   - The connection string in `appsettings.json` is set to use a relative path: `"Data Source=Data/BookStore.sqlite"`
   - The Program.cs file has been updated to resolve this path correctly in both development and production environments

2. **Database File Deployment**:
   - The `WebApplication4.csproj` file includes a directive to copy the Data directory to the output directory:
     ```xml
     <ItemGroup>
       <None Update="Data\**\*">
         <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
       </None>
     </ItemGroup>
     ```
   - This ensures the database file is included in the deployment package

3. **Read/Write Permissions**:
   - Azure Static Web Apps provides a read/write file system for the API functions
   - Database modifications made by the API will persist for the lifetime of that instance

## Database Seeding

If you need to seed or update the database during deployment:

1. Create a database initialization service in the API project
2. Register it to run during application startup
3. Use Entity Framework migrations to apply any schema changes

## Local Development vs. Azure

- **Local Development**: The database file is used directly from the local filesystem
- **Azure Deployment**: The database file is copied to the Azure instance during deployment
- The dynamic path resolution in Program.cs ensures the correct path is used in both environments

## Backup Considerations

Consider implementing a database backup strategy if the application relies on data persistence:

1. Periodic backups to Azure Blob Storage
2. Database export functionality in the admin interface
3. Scripted data seeding for fresh deployments
