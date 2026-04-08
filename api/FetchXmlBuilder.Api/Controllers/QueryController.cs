using FetchXmlBuilder.Api.Models;
using FetchXmlBuilder.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FetchXmlBuilder.Api.Controllers;

/// <summary>
/// Executes FetchXML queries against Dataverse/CRM via the SDK.
/// </summary>
[ApiController]
[Route("api/query")]
public class QueryController : ControllerBase
{
    private readonly DataverseSdkService _sdkService;
    private readonly IDataverseService _webApiService;
    private readonly ILogger<QueryController> _logger;

    public QueryController(
        DataverseSdkService sdkService,
        IDataverseService webApiService,
        ILogger<QueryController> logger)
    {
        _sdkService = sdkService;
        _webApiService = webApiService;
        _logger = logger;
    }

    /// <summary>
    /// Executes a FetchXML query via the CRM SDK.
    /// POST /api/query/execute
    /// Body: { "fetchXml": "...", "pagingCookie": null, "pageNumber": 1 }
    /// </summary>
    [HttpPost("execute")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> Execute([FromBody] FetchXmlRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _logger.LogInformation("POST /api/query/execute (page {Page})", request.PageNumber);

        var result = await _sdkService.ExecuteFetchXmlAsync(
            request.FetchXml,
            request.PagingCookie,
            request.PageNumber,
            cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Executes a FetchXML query via the Web API (GET, suitable for small queries).
    /// GET /api/query/execute?fetchXml=...&amp;pageNumber=1
    /// </summary>
    [HttpGet("execute")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> ExecuteGet(
        [FromQuery] string fetchXml,
        [FromQuery] string? pagingCookie,
        [FromQuery] int pageNumber = 1,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(fetchXml))
            return BadRequest("fetchXml query parameter is required.");

        _logger.LogInformation("GET /api/query/execute (page {Page})", pageNumber);

        var result = await _webApiService.ExecuteFetchXmlAsync(fetchXml, pagingCookie, pageNumber, cancellationToken);
        return Ok(result);
    }
}
