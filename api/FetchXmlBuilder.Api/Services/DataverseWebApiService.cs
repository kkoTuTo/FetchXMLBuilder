using System.Net.Http.Headers;
using System.Text.Json;
using FetchXmlBuilder.Api.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace FetchXmlBuilder.Api.Services;

/// <summary>
/// Calls the Dataverse/CRM Web API directly using an ADFS Bearer token.
/// Used for metadata queries (entities, attributes, relationships).
/// </summary>
public class DataverseWebApiService : IDataverseService
{
    private readonly OrgSettings _org;
    private readonly ITokenService _tokenService;
    private readonly IMemoryCache _cache;
    private readonly HttpClient _http;
    private readonly ILogger<DataverseWebApiService> _logger;

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };
    private static readonly TimeSpan MetadataCacheTtl = TimeSpan.FromHours(1);

    public DataverseWebApiService(
        IOptions<OrgSettings> orgOptions,
        ITokenService tokenService,
        IMemoryCache cache,
        IHttpClientFactory httpClientFactory,
        ILogger<DataverseWebApiService> logger)
    {
        _org = orgOptions.Value;
        _tokenService = tokenService;
        _cache = cache;
        _http = httpClientFactory.CreateClient(nameof(DataverseWebApiService));
        _logger = logger;
    }

    public async Task<JsonElement> GetEntitiesAsync(CancellationToken cancellationToken = default)
    {
        const string cacheKey = "metadata_entities";
        if (_cache.TryGetValue(cacheKey, out JsonElement cached))
            return cached;

        var select = "$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,IsCustomEntity,IsActivity";
        var filter = "$filter=IsValidForAdvancedFind eq true";
        var result = await GetWebApiAsync($"EntityDefinitions?{select}&{filter}", cancellationToken);

        _cache.Set(cacheKey, result, MetadataCacheTtl);
        return result;
    }

    public async Task<JsonElement> GetAttributesAsync(string entityName, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"metadata_attrs_{entityName}";
        if (_cache.TryGetValue(cacheKey, out JsonElement cached))
            return cached;

        var select = "$select=LogicalName,DisplayName,AttributeType,IsPrimaryId,IsPrimaryName,IsCustomAttribute,IsValidForRead,RequiredLevel";
        var result = await GetWebApiAsync($"EntityDefinitions(LogicalName='{entityName}')/Attributes?{select}", cancellationToken);

        _cache.Set(cacheKey, result, MetadataCacheTtl);
        return result;
    }

    public async Task<JsonElement> GetRelationshipsAsync(string entityName, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"metadata_rels_{entityName}";
        if (_cache.TryGetValue(cacheKey, out JsonElement cached))
            return cached;

        var manyToOne = await GetWebApiAsync($"EntityDefinitions(LogicalName='{entityName}')/ManyToOneRelationships?$select=SchemaName,ReferencedEntity,ReferencedAttribute,ReferencingAttribute", cancellationToken);
        var oneToMany = await GetWebApiAsync($"EntityDefinitions(LogicalName='{entityName}')/OneToManyRelationships?$select=SchemaName,ReferencedEntity,ReferencedAttribute,ReferencingAttribute,ReferencingEntity", cancellationToken);
        var manyToMany = await GetWebApiAsync($"EntityDefinitions(LogicalName='{entityName}')/ManyToManyRelationships?$select=SchemaName,Entity1LogicalName,Entity2LogicalName,IntersectEntityName", cancellationToken);

        var combined = new
        {
            ManyToOneRelationships = manyToOne,
            OneToManyRelationships = oneToMany,
            ManyToManyRelationships = manyToMany
        };

        var json = JsonSerializer.SerializeToElement(combined);
        _cache.Set(cacheKey, json, MetadataCacheTtl);
        return json;
    }

    public async Task<JsonElement> ExecuteFetchXmlAsync(string fetchXml, string? pagingCookie, int pageNumber, CancellationToken cancellationToken = default)
    {
        var entityName = ExtractEntityName(fetchXml);
        if (string.IsNullOrEmpty(entityName))
            throw new ArgumentException("Could not extract entity name from FetchXML.");

        var entitySetName = await ResolveEntitySetNameAsync(entityName, cancellationToken);
        var encoded = Uri.EscapeDataString(fetchXml);
        var url = $"{entitySetName}?fetchXml={encoded}";

        _logger.LogInformation("Executing FetchXML via Web API for entity {Entity}", SanitizeForLog(entityName));
        return await GetWebApiAsync(url, cancellationToken);
    }

    private async Task<string> ResolveEntitySetNameAsync(string entityName, CancellationToken cancellationToken)
    {
        var cacheKey = $"entityset_{entityName}";
        if (_cache.TryGetValue(cacheKey, out string? cached) && cached is not null)
            return cached;

        // Look up from entity metadata (already cached by GetEntitiesAsync)
        var entities = await GetEntitiesAsync(cancellationToken);
        if (entities.TryGetProperty("value", out var values))
        {
            foreach (var entity in values.EnumerateArray())
            {
                if (entity.TryGetProperty("LogicalName", out var ln) &&
                    ln.GetString()?.Equals(entityName, StringComparison.OrdinalIgnoreCase) == true &&
                    entity.TryGetProperty("EntitySetName", out var esn))
                {
                    var setName = esn.GetString() ?? entityName;
                    _cache.Set(cacheKey, setName, MetadataCacheTtl);
                    return setName;
                }
            }
        }

        // Fallback: query the entity definition directly
        var def = await GetWebApiAsync($"EntityDefinitions(LogicalName='{entityName}')?$select=EntitySetName", cancellationToken);
        if (def.TryGetProperty("EntitySetName", out var esnDirect))
        {
            var setName = esnDirect.GetString() ?? entityName;
            _cache.Set(cacheKey, setName, MetadataCacheTtl);
            return setName;
        }

        throw new InvalidOperationException($"Could not resolve EntitySetName for entity '{entityName}'.");
    }

    private async Task<JsonElement> GetWebApiAsync(string relativeUrl, CancellationToken cancellationToken)
    {
        var token = await _tokenService.GetTokenAsync(cancellationToken);
        var orgUrl = _org.OrgUrl.TrimEnd('/');
        var apiBase = $"{orgUrl}/api/data/v9.2/";
        var requestUrl = apiBase + relativeUrl;

        using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Headers.Add("OData-MaxVersion", "4.0");
        request.Headers.Add("OData-Version", "4.0");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        _logger.LogDebug("GET {Url}", SanitizeForLog(requestUrl));
        var response = await _http.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Web API call failed: {Status} {Body}", response.StatusCode, body);
            throw new HttpRequestException($"Dataverse Web API returned {(int)response.StatusCode}: {body}");
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        return doc.RootElement.Clone();
    }

    private static string SanitizeForLog(string value) =>
        value.Replace('\r', '_').Replace('\n', '_').Replace('\t', '_');

    private static string ExtractEntityName(string fetchXml)
    {
        // Simple regex-free extraction of the entity name attribute
        const string marker = "entity name=\"";
        var idx = fetchXml.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (idx < 0) return string.Empty;

        var start = idx + marker.Length;
        var end = fetchXml.IndexOf('"', start);
        return end < 0 ? string.Empty : fetchXml[start..end];
    }
}
