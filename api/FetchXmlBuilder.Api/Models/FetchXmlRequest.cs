using System.ComponentModel.DataAnnotations;

namespace FetchXmlBuilder.Api.Models;

public class FetchXmlRequest
{
    [Required]
    public string FetchXml { get; set; } = string.Empty;

    /// <summary>
    /// Optional paging cookie for retrieving subsequent pages
    /// </summary>
    public string? PagingCookie { get; set; }

    /// <summary>
    /// Page number (1-based), used together with PagingCookie
    /// </summary>
    public int PageNumber { get; set; } = 1;
}
