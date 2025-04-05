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
    
    // Special handling for Azure Static Web Apps
    var isAzure = Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID") != null;
    
    if (isAzure)
    {
        // Use a path in the writable storage area for Azure Static Web Apps
        string resolvedPath = Path.Combine("/data", dbPath);
        connectionString = $"Data Source={resolvedPath}";
        
        // Ensure the directory exists
        Directory.CreateDirectory(Path.GetDirectoryName(resolvedPath));
        
        // If database doesn't exist in the writable location, copy it there
        if (!File.Exists(resolvedPath))
        {
            string sourceDbPath = Path.Combine(builder.Environment.ContentRootPath, dbPath);
            if (File.Exists(sourceDbPath))
            {
                File.Copy(sourceDbPath, resolvedPath, true);
            }
        }
    }
    else
    {
        // Local development - use the content root path
        string resolvedPath = Path.Combine(builder.Environment.ContentRootPath, dbPath);
        connectionString = $"Data Source={resolvedPath}";
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
