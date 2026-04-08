namespace FetchXmlBuilder.Api.Services;

public interface ITokenService
{
    /// <summary>
    /// Returns a valid Bearer token for the configured CRM resource.
    /// Handles caching and automatic refresh.
    /// </summary>
    Task<string> GetTokenAsync(CancellationToken cancellationToken = default);
}
