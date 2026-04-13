# ── Build stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore – cache layer is invalidated only when project files change
COPY api/FetchXmlBuilder.Api/FetchXmlBuilder.Api.csproj api/FetchXmlBuilder.Api/
RUN dotnet restore api/FetchXmlBuilder.Api/FetchXmlBuilder.Api.csproj

# Copy source and publish
COPY api/FetchXmlBuilder.Api/ api/FetchXmlBuilder.Api/
RUN dotnet publish api/FetchXmlBuilder.Api/FetchXmlBuilder.Api.csproj \
      -c Release \
      -o /app/publish \
      --no-restore

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Non-root user for production security
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

COPY --from=build /app/publish .

# ASP.NET Core listens on 8080 by default inside the container
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "FetchXmlBuilder.Api.dll"]
