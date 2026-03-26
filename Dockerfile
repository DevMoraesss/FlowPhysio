# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy solution and project files
COPY PhysioFlow.sln ./
COPY src/PhysioFlow.Api/PhysioFlow.Api.csproj ./src/PhysioFlow.Api/
COPY src/PhysioFlow.Domain/PhysioFlow.Domain.csproj ./src/PhysioFlow.Domain/
COPY src/PhysioFlow.Infrastructure/PhysioFlow.Infrastructure.csproj ./src/PhysioFlow.Infrastructure/

# Restore dependencies
RUN dotnet restore

# Copy source code
COPY src/ ./src/

# Build and publish
RUN dotnet publish src/PhysioFlow.Api/PhysioFlow.Api.csproj -c Release -o out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy published output
COPY --from=build /app/out .

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080

# Start the application
ENTRYPOINT ["dotnet", "PhysioFlow.Api.dll"]
