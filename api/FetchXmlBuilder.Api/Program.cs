using FetchXmlBuilder.Api.Models;
using FetchXmlBuilder.Api.Services;
using Serilog;

// ── Serilog bootstrap logger (captures startup errors before full config loads) ──────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog ─────────────────────────────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, services, cfg) =>
        cfg.ReadFrom.Configuration(ctx.Configuration)
           .ReadFrom.Services(services)
           .Enrich.FromLogContext()
           .WriteTo.Console());

    // ── Configuration bindings ───────────────────────────────────────────────────────
    builder.Services.Configure<OrgSettings>(builder.Configuration.GetSection("CrmSettings"));
    builder.Services.Configure<AdfsSettings>(builder.Configuration.GetSection("AdfsSettings"));

    // ── CORS ─────────────────────────────────────────────────────────────────────────
    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>() ?? [];

    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod());
    });

    // ── HTTP clients ─────────────────────────────────────────────────────────────────
    var validateCert = builder.Configuration.GetValue<bool>("AdfsSettings:ValidateCertificate", true);

    builder.Services.AddHttpClient(nameof(AdfsTokenService))
        .ConfigurePrimaryHttpMessageHandler(() =>
        {
            var handler = new HttpClientHandler();
            if (!validateCert)
                handler.ServerCertificateCustomValidationCallback =
                    HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
            return handler;
        });

    builder.Services.AddHttpClient(nameof(DataverseWebApiService))
        .ConfigurePrimaryHttpMessageHandler(() =>
        {
            var handler = new HttpClientHandler();
            if (!validateCert)
                handler.ServerCertificateCustomValidationCallback =
                    HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
            return handler;
        });

    // ── In-memory cache ───────────────────────────────────────────────────────────────
    builder.Services.AddMemoryCache();

    // ── Application services ──────────────────────────────────────────────────────────
    builder.Services.AddSingleton<ITokenService, AdfsTokenService>();
    builder.Services.AddScoped<IDataverseService, DataverseWebApiService>();
    builder.Services.AddScoped<DataverseSdkService>();

    // ── Controllers + Swagger ─────────────────────────────────────────────────────────
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new() { Title = "FetchXML Builder API", Version = "v1" });
        c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "Enter the ADFS Bearer token (optional — backend handles auth by default)",
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            BearerFormat = "JWT",
            Scheme = "bearer"
        });
    });

    // ── Health checks ─────────────────────────────────────────────────────────────────
    builder.Services.AddHealthChecks();

    var app = builder.Build();

    // ── Middleware pipeline ───────────────────────────────────────────────────────────
    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "FetchXML Builder API v1"));
    }

    app.UseCors();
    app.UseHttpsRedirection();
    app.UseAuthorization();

    app.MapControllers();
    app.MapHealthChecks("/health");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application startup failed");
    return 1;
}
finally
{
    Log.CloseAndFlush();
}

return 0;

