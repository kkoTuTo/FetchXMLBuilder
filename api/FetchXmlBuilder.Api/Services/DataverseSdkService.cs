using System.Text.Json;
using System.Xml.Linq;
using FetchXmlBuilder.Api.Models;
using Microsoft.PowerPlatform.Dataverse.Client;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Extensions.Options;

namespace FetchXmlBuilder.Api.Services;

/// <summary>
/// Executes FetchXML queries via the Dataverse/CRM SDK (ServiceClient).
/// Supports IFD authentication with either connection-string credentials or
/// a token provider backed by AdfsTokenService.
/// </summary>
public class DataverseSdkService
{
    private readonly OrgSettings _org;
    private readonly ITokenService _tokenService;
    private readonly ILogger<DataverseSdkService> _logger;

    public DataverseSdkService(
        IOptions<OrgSettings> orgOptions,
        ITokenService tokenService,
        ILogger<DataverseSdkService> logger)
    {
        _org = orgOptions.Value;
        _tokenService = tokenService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a ServiceClient using the ADFS token provider.
    /// </summary>
    private ServiceClient CreateServiceClient()
    {
        _logger.LogDebug("Creating Dataverse ServiceClient for {OrgUrl}", _org.OrgUrl);

        return new ServiceClient(
            instanceUrl: new Uri(_org.OrgUrl),
            tokenProviderFunction: async _ => await _tokenService.GetTokenAsync(),
            useUniqueInstance: false,
            logger: null);
    }

    /// <summary>
    /// Executes FetchXML via SDK RetrieveMultiple and returns results as JSON.
    /// </summary>
    public async Task<JsonElement> ExecuteFetchXmlAsync(
        string fetchXml,
        string? pagingCookie,
        int pageNumber,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Executing FetchXML via SDK (page {Page})", pageNumber);

        var query = new FetchExpression(InjectPaging(fetchXml, pagingCookie, pageNumber));

        return await Task.Run(() =>
        {
            using var client = CreateServiceClient();
            if (!client.IsReady)
                throw new InvalidOperationException($"Dataverse SDK connection failed: {client.LastError}");

            var result = client.RetrieveMultiple(query);
            return SerializeResult(result);
        }, cancellationToken);
    }

    private static string InjectPaging(string fetchXml, string? pagingCookie, int pageNumber)
    {
        if (pageNumber <= 1 && string.IsNullOrEmpty(pagingCookie))
            return fetchXml;

        var doc = XDocument.Parse(fetchXml);
        var fetch = doc.Root ?? throw new ArgumentException("Invalid FetchXML: no root element.");

        fetch.SetAttributeValue("page", pageNumber.ToString());
        if (!string.IsNullOrEmpty(pagingCookie))
            fetch.SetAttributeValue("paging-cookie", pagingCookie);

        return doc.ToString(SaveOptions.DisableFormatting);
    }

    private static JsonElement SerializeResult(EntityCollection result)
    {
        var records = result.Entities.Select(entity =>
        {
            var dict = new Dictionary<string, object?>();
            dict["id"] = entity.Id.ToString();
            dict["logicalName"] = entity.LogicalName;

            foreach (var attr in entity.Attributes)
            {
                dict[attr.Key] = attr.Value switch
                {
                    EntityReference er => new { id = er.Id.ToString(), logicalName = er.LogicalName, name = er.Name },
                    OptionSetValue osv => osv.Value,
                    Money money => money.Value,
                    AliasedValue av => av.Value,
                    _ => attr.Value
                };
            }

            return dict;
        }).ToList();

        var response = new
        {
            totalRecordCount = result.TotalRecordCount,
            moreRecords = result.MoreRecords,
            pagingCookie = result.PagingCookie,
            entityName = result.EntityName,
            records
        };

        return JsonSerializer.SerializeToElement(response);
    }
}
