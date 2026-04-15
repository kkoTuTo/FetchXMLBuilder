using System.Text.Json;

namespace FetchXmlBuilder.Api.Services;

public interface IDataverseService
{
    /// <summary>
    /// Returns a list of entities with LogicalName, DisplayName and other basic metadata.
    /// </summary>
    Task<JsonElement> GetEntitiesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the attribute definitions for a given entity.
    /// </summary>
    Task<JsonElement> GetAttributesAsync(string entityName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the relationship definitions for a given entity.
    /// </summary>
    Task<JsonElement> GetRelationshipsAsync(string entityName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes a FetchXML query via the CRM SDK and returns the raw result set as JSON.
    /// </summary>
    Task<JsonElement> ExecuteFetchXmlAsync(string fetchXml, string? pagingCookie, int pageNumber, CancellationToken cancellationToken = default);
}
