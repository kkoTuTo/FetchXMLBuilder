using FetchXmlBuilder.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FetchXmlBuilder.Api.Controllers;

/// <summary>
/// Provides Dataverse entity/attribute/relationship metadata for the FetchXML Builder frontend.
/// Results are cached in memory for 1 hour.
/// </summary>
[ApiController]
[Route("api/metadata")]
public class MetadataController : ControllerBase
{
    private readonly IDataverseService _dataverse;
    private readonly ILogger<MetadataController> _logger;

    private static string SanitizeForLog(string value) =>
        value.Replace('\r', '_').Replace('\n', '_').Replace('\t', '_');

    public MetadataController(IDataverseService dataverse, ILogger<MetadataController> logger)
    {
        _dataverse = dataverse;
        _logger = logger;
    }

    /// <summary>
    /// Returns all entities available for advanced find.
    /// GET /api/metadata/entities
    /// </summary>
    [HttpGet("entities")]
    [ProducesResponseType(200)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> GetEntities(CancellationToken cancellationToken)
    {
        _logger.LogInformation("GET /api/metadata/entities");
        var result = await _dataverse.GetEntitiesAsync(cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns attribute definitions for the specified entity.
    /// GET /api/metadata/entities/{entityName}/attributes
    /// </summary>
    [HttpGet("entities/{entityName}/attributes")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> GetAttributes(string entityName, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(entityName))
            return BadRequest("entityName is required.");

        _logger.LogInformation("GET /api/metadata/entities/{EntityName}/attributes", SanitizeForLog(entityName));
        var result = await _dataverse.GetAttributesAsync(entityName, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns relationship definitions for the specified entity.
    /// GET /api/metadata/entities/{entityName}/relationships
    /// </summary>
    [HttpGet("entities/{entityName}/relationships")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> GetRelationships(string entityName, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(entityName))
            return BadRequest("entityName is required.");

        _logger.LogInformation("GET /api/metadata/entities/{EntityName}/relationships", SanitizeForLog(entityName));
        var result = await _dataverse.GetRelationshipsAsync(entityName, cancellationToken);
        return Ok(result);
    }
}
