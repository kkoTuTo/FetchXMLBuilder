using FetchXmlBuilder.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace FetchXmlBuilder.Api.Tests;

public class ModelsTests
{
    // ─── AdfsSettings ─────────────────────────────────────────────────────────

    [Fact]
    public void AdfsSettings_DefaultGrantType_IsClientCredentials()
    {
        var settings = new AdfsSettings();
        Assert.Equal("client_credentials", settings.GrantType);
    }

    [Fact]
    public void AdfsSettings_DefaultValidateCertificate_IsTrue()
    {
        var settings = new AdfsSettings();
        Assert.True(settings.ValidateCertificate);
    }

    [Theory]
    [InlineData("client_credentials")]
    [InlineData("password")]
    public void AdfsSettings_GrantType_AcceptsValidValues(string grantType)
    {
        var settings = new AdfsSettings { GrantType = grantType };
        Assert.Equal(grantType, settings.GrantType);
    }

    // ─── FetchXmlRequest ──────────────────────────────────────────────────────

    [Fact]
    public void FetchXmlRequest_DefaultPageNumber_IsOne()
    {
        var request = new FetchXmlRequest();
        Assert.Equal(1, request.PageNumber);
    }

    [Fact]
    public void FetchXmlRequest_RequiredAttribute_OnFetchXml()
    {
        var type = typeof(FetchXmlRequest);
        var prop = type.GetProperty(nameof(FetchXmlRequest.FetchXml))!;
        var attr = prop.GetCustomAttributes(typeof(RequiredAttribute), false);
        Assert.NotEmpty(attr);
    }

    [Fact]
    public void FetchXmlRequest_PagingCookie_IsNullable()
    {
        var request = new FetchXmlRequest { FetchXml = "<fetch/>" };
        Assert.Null(request.PagingCookie);
    }

    // ─── OrgSettings ─────────────────────────────────────────────────────────

    [Fact]
    public void OrgSettings_DefaultAuthType_IsIfd()
    {
        var settings = new OrgSettings();
        Assert.Equal("IFD", settings.AuthType);
    }
}
