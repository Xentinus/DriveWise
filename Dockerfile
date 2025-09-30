# Use the official .NET 9.0 runtime as a parent image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8800
# Expose standard HTTP/HTTPS ports for outbound web API calls
EXPOSE 80 443

# Use the SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["DriveWise.csproj", "."]
RUN dotnet restore "DriveWise.csproj"

# Copy everything else and build
COPY . .
RUN dotnet build "DriveWise.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "DriveWise.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage/image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Copy appsettings.json files if they exist and contain API keys
# This will override the published versions with actual API keys
COPY appsettings*.json ./

# Set the environment variables for Docker
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8800

ENTRYPOINT ["dotnet", "DriveWise.dll"]