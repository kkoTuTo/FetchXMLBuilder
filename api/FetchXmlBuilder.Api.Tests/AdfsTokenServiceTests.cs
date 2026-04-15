using FetchXmlBuilder.Api.Models;
using FetchXmlBuilder.Api.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using System.Net.Http.Json;

namespace FetchXmlBuilder.Api.Tests;

public class AdfsTokenServiceTests
{
    private static IOptions<AdfsSettings> MakeOptions(string grantType = "client_credentials",
        string? username = null, string? password = null) =>
        Options.Create(new AdfsSettings
        {
            Endpoint = "https://adfs.contoso.com/adfs/oauth2/token",
            ClientId = "test-client-id",
            ClientSecret = "test-secret",
            Resource = "https://crm.contoso.com/OrgName/",
            GrantType = grantType,
            Username = username,
            Password = password,
        });

    private static IMemoryCache NewCache() =>
        new MemoryCache(new MemoryCacheOptions());

    // ─── BuildFormContent ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetTokenAsync_ClientCredentials_ReturnsToken()
    {
        // The fake ADFS endpoint returns a minimal JWT-like access_token
        var fakeToken = "header.eyJleHAiOjk5OTk5OTk5OTksInN1YiI6InRlc3QifQ.sig";
        var handler = new MockHttpMessageHandler(HttpStatusCode.OK,
            $"{{\"access_token\":\"{fakeToken}\",\"expires_in\":3600,\"token_type\":\"Bearer\"}}");

        var factory = new MockHttpClientFactory(handler);
        var sut = new AdfsTokenService(
            MakeOptions("client_credentials"),
            NewCache(),
            factory,
            NullLogger<AdfsTokenService>.Instance);

        var token = await sut.GetTokenAsync();

        Assert.Equal(fakeToken, token);
    }

    [Fact]
    public async Task GetTokenAsync_CachesToken_SecondCallDoesNotHitNetwork()
    {
        var fakeToken = "header.eyJleHAiOjk5OTk5OTk5OTksInN1YiI6InRlc3QifQ.sig";
        var handler = new MockHttpMessageHandler(HttpStatusCode.OK,
            $"{{\"access_token\":\"{fakeToken}\",\"expires_in\":3600,\"token_type\":\"Bearer\"}}");

        var factory = new MockHttpClientFactory(handler);
        var sut = new AdfsTokenService(
            MakeOptions(),
            NewCache(),
            factory,
            NullLogger<AdfsTokenService>.Instance);

        var t1 = await sut.GetTokenAsync();
        var t2 = await sut.GetTokenAsync();

        Assert.Equal(fakeToken, t1);
        Assert.Equal(fakeToken, t2);
        Assert.Equal(1, handler.CallCount); // network hit only once
    }

    [Fact]
    public async Task GetTokenAsync_ServerError_ThrowsInvalidOperationException()
    {
        var handler = new MockHttpMessageHandler(HttpStatusCode.Unauthorized, "unauthorized");
        var factory = new MockHttpClientFactory(handler);
        var sut = new AdfsTokenService(
            MakeOptions(),
            NewCache(),
            factory,
            NullLogger<AdfsTokenService>.Instance);

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.GetTokenAsync());
    }

    [Fact]
    public async Task GetTokenAsync_PasswordFlow_MissingCredentials_Throws()
    {
        // password grant without username/password
        var handler = new MockHttpMessageHandler(HttpStatusCode.OK,
            "{\"access_token\":\"tok\",\"expires_in\":3600,\"token_type\":\"Bearer\"}");
        var factory = new MockHttpClientFactory(handler);
        var sut = new AdfsTokenService(
            MakeOptions("password", username: null, password: null),
            NewCache(),
            factory,
            NullLogger<AdfsTokenService>.Instance);

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.GetTokenAsync());
    }

    [Fact]
    public async Task GetTokenAsync_PasswordFlow_WithCredentials_ReturnsToken()
    {
        const string fakeToken = "tok";
        var handler = new MockHttpMessageHandler(HttpStatusCode.OK,
            $"{{\"access_token\":\"{fakeToken}\",\"expires_in\":3600,\"token_type\":\"Bearer\"}}");
        var factory = new MockHttpClientFactory(handler);
        var sut = new AdfsTokenService(
            MakeOptions("password", username: "DOMAIN\\user", password: "pass"),
            NewCache(),
            factory,
            NullLogger<AdfsTokenService>.Instance);

        var token = await sut.GetTokenAsync();

        Assert.Equal(fakeToken, token);
        // Verify username/password were in the form body
        var body = handler.LastRequestBody;
        Assert.Contains("grant_type=password", body);
        Assert.Contains("username=", body);
        Assert.Contains("password=", body);
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

internal sealed class MockHttpMessageHandler : HttpMessageHandler
{
    private readonly HttpStatusCode _statusCode;
    private readonly string _responseBody;

    public int CallCount { get; private set; }
    public string LastRequestBody { get; private set; } = string.Empty;

    public MockHttpMessageHandler(HttpStatusCode statusCode, string responseBody)
    {
        _statusCode = statusCode;
        _responseBody = responseBody;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        CallCount++;
        if (request.Content is not null)
            LastRequestBody = await request.Content.ReadAsStringAsync(cancellationToken);

        return new HttpResponseMessage(_statusCode)
        {
            Content = new StringContent(_responseBody, System.Text.Encoding.UTF8, "application/json")
        };
    }
}

internal sealed class MockHttpClientFactory : IHttpClientFactory
{
    private readonly MockHttpMessageHandler _handler;

    public MockHttpClientFactory(MockHttpMessageHandler handler)
    {
        _handler = handler;
    }

    public HttpClient CreateClient(string name) => new(_handler);
}
