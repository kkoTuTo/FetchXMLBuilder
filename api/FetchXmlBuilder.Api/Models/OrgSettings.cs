namespace FetchXmlBuilder.Api.Models;

public class OrgSettings
{
    public string OrgUrl { get; set; } = string.Empty;

    /// <summary>
    /// Authentication type: "IFD" or "AD"
    /// </summary>
    public string AuthType { get; set; } = "IFD";

    /// <summary>
    /// Domain for AD/IFD username authentication (e.g. "CONTOSO")
    /// </summary>
    public string? Domain { get; set; }
}
