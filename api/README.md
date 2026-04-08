# FetchXML Builder — Backend API

ASP.NET Core 9 Web API that acts as a proxy between the React frontend and
an on-premises Dynamics CRM / Dataverse environment secured by ADFS + OAuth2.

## Authentication

The backend supports two ADFS OAuth2 grant flows:

| Flow | `GrantType` | Use-case |
|---|---|---|
| **Client Credentials** | `client_credentials` | Service-account / background workers |
| **ROPC (Password)** | `password` | Interactive login with user credentials |

No MSAL / Azure AD dependency — all token acquisition is handled by `AdfsTokenService`.

## Configuration

Copy `appsettings.json` values into your environment or `appsettings.Development.json`:

```json
{
  "CrmSettings": {
    "OrgUrl": "https://crm.contoso.com/OrgName",
    "AuthType": "IFD"
  },
  "AdfsSettings": {
    "Endpoint": "https://adfs.contoso.com/adfs/oauth2/token",
    "ClientId": "<client-id registered in ADFS>",
    "ClientSecret": "<client-secret, leave empty for public clients>",
    "Resource": "https://crm.contoso.com/OrgName/",
    "GrantType": "client_credentials"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173"]
  }
}
```

For ROPC (password) flow also set:

```json
"GrantType": "password",
"Username": "DOMAIN\\svcaccount",
"Password": "<password>"
```

**Never commit real credentials** — use environment variables or a secrets manager in production.

## Running locally

```bash
cd api/FetchXmlBuilder.Api
dotnet run
```

Swagger UI is available at `https://localhost:7048/swagger` in Development mode.

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/auth/context` | Returns Bearer token + org URL for frontend |
| `GET` | `/api/auth/health` | Verifies token acquisition works |
| `GET` | `/api/metadata/entities` | All entities (cached 1 h) |
| `GET` | `/api/metadata/entities/{name}/attributes` | Entity attributes |
| `GET` | `/api/metadata/entities/{name}/relationships` | Entity relationships |
| `POST` | `/api/query/execute` | Execute FetchXML (SDK) |
| `GET` | `/api/query/execute?fetchXml=...` | Execute FetchXML (Web API, small queries) |
| `GET` | `/health` | ASP.NET Core health check |
