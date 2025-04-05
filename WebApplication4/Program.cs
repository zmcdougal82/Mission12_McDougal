using WebApplication4.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

// Register the SQLite DbContext using the connection string
string connectionString = builder.Configuration.GetConnectionString("BookStoreConnection");
    
// Ensure database path is correct for the environment
if (!Path.IsPathRooted(connectionString.Replace("Data Source=", "")))
{
    // Extract the relative path part
    string dbPath = connectionString.Replace("Data Source=", "");
    
    // Add debug logging
    Console.WriteLine($"Original connection string: {connectionString}");
    Console.WriteLine($"Content root path: {builder.Environment.ContentRootPath}");
    
    // Special handling for Azure Static Web Apps
    var isAzure = Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID") != null;
    Console.WriteLine($"Running in Azure: {isAzure}");
    
    if (isAzure)
    {
        // Use a path in the writable storage area for Azure Static Web Apps
        string resolvedPath = Path.Combine("/data", dbPath);
        connectionString = $"Data Source={resolvedPath}";
        Console.WriteLine($"Azure database path: {resolvedPath}");
        
        try
        {
            // List all directories in content root
            string[] directories = Directory.GetDirectories(builder.Environment.ContentRootPath);
            Console.WriteLine($"Directories in content root: {string.Join(", ", directories)}");
            
            // Ensure the directory exists
            string dbDir = Path.GetDirectoryName(resolvedPath);
            Console.WriteLine($"Creating directory: {dbDir}");
            Directory.CreateDirectory(dbDir);
            
            // If database doesn't exist in the writable location, copy it there
            if (!File.Exists(resolvedPath))
            {
                string sourceDbPath = Path.Combine(builder.Environment.ContentRootPath, dbPath);
                Console.WriteLine($"Source database path: {sourceDbPath}");
                Console.WriteLine($"Source database exists: {File.Exists(sourceDbPath)}");
                
                if (File.Exists(sourceDbPath))
                {
                    Console.WriteLine($"Copying database from {sourceDbPath} to {resolvedPath}");
                    File.Copy(sourceDbPath, resolvedPath, true);
                    Console.WriteLine($"Database copied successfully");
                }
                else
                {
                    // Try alternative paths
                    string altPath = Path.Combine(builder.Environment.ContentRootPath, "Data", "BookStore.sqlite");
                    Console.WriteLine($"Trying alternative source path: {altPath}");
                    Console.WriteLine($"Alternative source exists: {File.Exists(altPath)}");
                    
                    if (File.Exists(altPath))
                    {
                        Console.WriteLine($"Copying database from alternative path {altPath} to {resolvedPath}");
                        File.Copy(altPath, resolvedPath, true);
                    }
                    else
                    {
                        Console.WriteLine("Creating empty database file");
                        // Create an empty database file
                        using (var fileStream = File.Create(resolvedPath)) { }
                    }
                }
            }
            else
            {
                Console.WriteLine($"Database already exists at {resolvedPath}");
            }
            
            // Verify the database file
            Console.WriteLine($"Database file exists after setup: {File.Exists(resolvedPath)}");
            Console.WriteLine($"Database file size: {(File.Exists(resolvedPath) ? new FileInfo(resolvedPath).Length : 0)} bytes");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error setting up database: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
        }
    }
    else
    {
        // Local development - use the content root path
        string resolvedPath = Path.Combine(builder.Environment.ContentRootPath, dbPath);
        connectionString = $"Data Source={resolvedPath}";
        Console.WriteLine($"Local database path: {resolvedPath}");
        Console.WriteLine($"Local database exists: {File.Exists(resolvedPath)}");
    }
}

builder.Services.AddDbContext<BookStoreContext>(options =>
    options.UseSqlite(connectionString));

// Add services to the container
builder.Services.AddControllersWithViews();

// Add CORS services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// In production, the React files will be served from this directory
builder.Services.AddSpaStaticFiles(configuration =>
{
    configuration.RootPath = "bookstore-client/build";
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

// Enable CORS
app.UseCors("AllowReactApp");

app.UseStaticFiles();
app.UseSpaStaticFiles();

app.UseRouting();

app.UseAuthorization();

// Map API controllers first
app.MapControllers();

// Then map MVC controller routes
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// Finally, use SPA fallback for any non-API routes
app.MapWhen(
    context => !context.Request.Path.StartsWithSegments("/api"),
    appBuilder =>
    {
        appBuilder.UseSpa(spa =>
        {
            spa.Options.SourcePath = "bookstore-client";

            if (app.Environment.IsDevelopment())
            {
                spa.UseReactDevelopmentServer(npmScript: "start");
            }
        });
    }
);

app.Run();
