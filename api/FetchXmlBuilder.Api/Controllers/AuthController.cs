using FetchXmlBuilder.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FetchXmlBuilder.Api.Controllers;

/// <summary>
/// Returns current authentication context for the frontend.
/// The frontend can use the token + orgUrl to make direct Web API calls
/// (similar to Dataverse REST Builder's BEContext mode).
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(ITokenService tokenService, IConfiguration config, ILogger<AuthController> logger)
    {
        _tokenService = tokenService;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Returns a valid access token, org URL, and Web API version for frontend use.
    /// GET /api/auth/context
    /// </summary>
    [HttpGet("context")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetContext(CancellationToken cancellationToken)
    {
        var token = await _tokenService.GetTokenAsync(cancellationToken);
        var orgUrl = _config["CrmSettings:OrgUrl"]?.TrimEnd('/') ?? string.Empty;

        return Ok(new
        {
            token,
            orgUrl,
            apiVersion = "9.2",
            webApiBase = $"{orgUrl}/api/data/v9.2/"
        });
    }

    /// <summary>
    /// Health check for authentication — validates that a token can be obtained.
    /// GET /api/auth/health
    /// </summary>
    [HttpGet("health")]
    [ProducesResponseType(200)]
    [ProducesResponseType(503)]
    public async Task<IActionResult> Health(CancellationToken cancellationToken)
    {
        try
        {
            var token = await _tokenService.GetTokenAsync(cancellationToken);
            _logger.LogInformation("Auth health check: OK");
            return Ok(new { status = "ok", hasToken = !string.IsNullOrEmpty(token) });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Auth health check failed");
            return StatusCode(503, new { status = "error", message = ex.Message });
        }
    }
}
