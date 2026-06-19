namespace PhysioFlow.Api.Services;

public interface IStorageService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, Guid patientId);
    Task<string> GetSignedUrlAsync(string filePath, int expiresInSeconds = 3600);
    Task DeleteAsync(string filePath);
}
