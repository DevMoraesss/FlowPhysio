using System.Text;
using System.Text.Json;

namespace PhysioFlow.Api.Services;

public class SupabaseStorageService : IStorageService
{
    private readonly HttpClient _http;
    private readonly string _supabaseUrl;
    private readonly string _bucket;

    public SupabaseStorageService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _supabaseUrl = (config["Supabase:Url"] ?? "").TrimEnd('/');
        _bucket = config["Supabase:Bucket"] ?? "attachments";

        var serviceKey = config["Supabase:ServiceKey"];
        if (!string.IsNullOrEmpty(serviceKey))
            _http.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"Bearer {serviceKey}");
    }

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, Guid patientId)
    {
        var path = $"{patientId}/{Guid.NewGuid()}_{SanitizeFileName(fileName)}";
        var url = $"{_supabaseUrl}/storage/v1/object/{_bucket}/{path}";

        using var content = new StreamContent(fileStream);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);

        var response = await _http.PostAsync(url, content);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            throw new Exception($"Upload falhou: {response.StatusCode} — {body}");
        }

        return path;
    }

    public async Task<string> GetSignedUrlAsync(string filePath, int expiresInSeconds = 3600)
    {
        var url = $"{_supabaseUrl}/storage/v1/object/sign/{_bucket}/{filePath}";
        var body = JsonSerializer.Serialize(new { expiresIn = expiresInSeconds });

        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        var response = await _http.PostAsync(url, content);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var signedPath = doc.RootElement.GetProperty("signedURL").GetString()!;

        return $"{_supabaseUrl}{signedPath}";
    }

    public async Task DeleteAsync(string filePath)
    {
        var url = $"{_supabaseUrl}/storage/v1/object/{_bucket}";
        var body = JsonSerializer.Serialize(new { prefixes = new[] { filePath } });

        using var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Content = new StringContent(body, Encoding.UTF8, "application/json");

        var response = await _http.SendAsync(request);

        if (!response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.NotFound)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            throw new Exception($"Delete falhou: {response.StatusCode} — {responseBody}");
        }
    }

    private static string SanitizeFileName(string fileName) =>
        string.Join("_", fileName.Split(Path.GetInvalidFileNameChars()));
}
