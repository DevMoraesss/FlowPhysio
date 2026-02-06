# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy solution and project files
COPY PsicoFlow.sln ./
COPY src/PsicoFlow.Api/PsicoFlow.Api.csproj ./src/PsicoFlow.Api/
COPY src/PsicoFlow.Domain/PsicoFlow.Domain.csproj ./src/PsicoFlow.Domain/
COPY src/PsicoFlow.Infrastructure/PsicoFlow.Infrastructure.csproj ./src/PsicoFlow.Infrastructure/

# Restore dependencies
RUN dotnet restore

# Copy source code
COPY src/ ./src/

# Build and publish
RUN dotnet publish src/PsicoFlow.Api/PsicoFlow.Api.csproj -c Release -o out

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
ENTRYPOINT ["dotnet", "PsicoFlow.Api.dll"]
