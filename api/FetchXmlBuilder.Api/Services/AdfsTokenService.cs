using Serilog;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using FetchXmlBuilder.Api.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace FetchXmlBuilder.Api.Services;

/// <summary>
/// Obtains OAuth2 tokens from an ADFS server using either the Client Credentials
/// or Resource Owner Password Credentials (ROPC) grant flow.
/// Tokens are cached in memory and refreshed 5 minutes before expiry.
/// </summary>
public class AdfsTokenService : ITokenService
{
    private const string CacheKey = "adfs_access_token";
    private static readonly TimeSpan RefreshBuffer = TimeSpan.FromMinutes(5);

    private readonly AdfsSettings _adfs;
    private readonly IMemoryCache _cache;
    private readonly HttpClient _http;
    private readonly ILogger<AdfsTokenService> _logger;

    public AdfsTokenService(
        IOptions<AdfsSettings> adfsOptions,
        IMemoryCache cache,
        IHttpClientFactory httpClientFactory,
        ILogger<AdfsTokenService> logger)
    {
        _adfs = adfsOptions.Value;
        _cache = cache;
        _http = httpClientFactory.CreateClient(nameof(AdfsTokenService));
        _logger = logger;
    }

    public async Task<string> GetTokenAsync(CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(CacheKey, out string? cached) && cached is not null)
            return cached;

        _logger.LogInformation("Requesting new ADFS token (grant_type={GrantType})", _adfs.GrantType);

        var form = BuildFormContent();
        var response = await _http.PostAsync(_adfs.Endpoint, form, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("ADFS token request failed: {Status} {Error}", response.StatusCode, error);
            throw new InvalidOperationException($"ADFS token request failed ({response.StatusCode}): {error}");
        }

        var json = await response.Content.ReadFromJsonAsync<AdfsTokenResponse>(cancellationToken: cancellationToken)
            ?? throw new InvalidOperationException("Empty response from ADFS token endpoint");

        var expiry = GetTokenExpiry(json.AccessToken, json.ExpiresIn);
        var cacheExpiry = expiry - RefreshBuffer;

        _cache.Set(CacheKey, json.AccessToken, new MemoryCacheEntryOptions
        {
            AbsoluteExpiration = cacheExpiry > DateTimeOffset.UtcNow ? cacheExpiry : DateTimeOffset.UtcNow.AddSeconds(30)
        });

        _logger.LogInformation("ADFS token acquired, expires at {Expiry}", expiry);
        return json.AccessToken;
    }

    private FormUrlEncodedContent BuildFormContent()
    {
        var pairs = new List<KeyValuePair<string, string>>
        {
            new("grant_type", _adfs.GrantType),
            new("client_id", _adfs.ClientId),
            new("resource", _adfs.Resource)
        };

        if (!string.IsNullOrEmpty(_adfs.ClientSecret))
            pairs.Add(new("client_secret", _adfs.ClientSecret));

        if (_adfs.GrantType == "password")
        {
            if (string.IsNullOrEmpty(_adfs.Username) || string.IsNullOrEmpty(_adfs.Password))
                throw new InvalidOperationException("Username and Password are required for ROPC grant flow.");

            pairs.Add(new("username", _adfs.Username));
            pairs.Add(new("password", _adfs.Password));
        }

        return new FormUrlEncodedContent(pairs);
    }

    private static DateTimeOffset GetTokenExpiry(string accessToken, int? expiresIn)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            if (handler.CanReadToken(accessToken))
            {
                var jwt = handler.ReadJwtToken(accessToken);
                return new DateTimeOffset(jwt.ValidTo, TimeSpan.Zero);
            }
        }
        catch (Exception ex)
        {
            // JWT parsing is best-effort; fall back to expires_in from the token response
            Log.Debug(ex, "Could not parse JWT expiry; falling back to expires_in value");
        }

        return DateTimeOffset.UtcNow.AddSeconds(expiresIn ?? 3600);
    }

    private sealed class AdfsTokenResponse
    {
        [System.Text.Json.Serialization.JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("expires_in")]
        public int? ExpiresIn { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("token_type")]
        public string TokenType { get; set; } = string.Empty;
    }
}
