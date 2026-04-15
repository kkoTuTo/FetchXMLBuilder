namespace FetchXmlBuilder.Api.Models;

public class AdfsSettings
{
    /// <summary>
    /// ADFS OAuth2 token endpoint, e.g. https://adfs.contoso.com/adfs/oauth2/token
    /// </summary>
    public string Endpoint { get; set; } = string.Empty;

    public string ClientId { get; set; } = string.Empty;

    /// <summary>
    /// Required for client_credentials flow; optional for ROPC flow
    /// </summary>
    public string? ClientSecret { get; set; }

    /// <summary>
    /// The resource URI that CRM is registered as in ADFS, e.g. https://crm.contoso.com/OrgName/
    /// </summary>
    public string Resource { get; set; } = string.Empty;

    /// <summary>
    /// Grant type: "client_credentials" (default) or "password" (ROPC)
    /// </summary>
    public string GrantType { get; set; } = "client_credentials";

    /// <summary>
    /// Username for ROPC flow (domain\user or user@domain)
    /// </summary>
    public string? Username { get; set; }

    /// <summary>
    /// Password for ROPC flow
    /// </summary>
    public string? Password { get; set; }

    /// <summary>
    /// Whether to validate the ADFS server certificate (set false only in dev/test with self-signed certs)
    /// </summary>
    public bool ValidateCertificate { get; set; } = true;
}
