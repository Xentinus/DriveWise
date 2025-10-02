using DriveWise.Models;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace DriveWise.Services
{
    public class RouteShareService : IRouteShareService
    {
        private readonly string _encryptionKey;
        private readonly ILogger<RouteShareService> _logger;

        public RouteShareService(IConfiguration configuration, ILogger<RouteShareService> logger)
        {
            _encryptionKey = configuration["RouteShare:EncryptionKey"] ?? "DriveWise_Route_Encryption_Key_2024!@#";
            _logger = logger;
        }

        public string GenerateShareableLink(double fromLat, double fromLon, double toLat, double toLon, string baseUrl)
        {
            try
            {
                var encryptedId = EncryptRouteData(fromLat, fromLon, toLat, toLon);
                return $"{baseUrl.TrimEnd('/')}/?route={Uri.EscapeDataString(encryptedId)}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hiba a megosztható link generálásában");
                throw;
            }
        }

        public RouteShareData? DecodeShareableId(string shareId)
        {
            try
            {
                return DecryptRouteData(shareId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hiba a megosztási azonosító dekódolásában: {ShareId}", shareId);
                return null;
            }
        }

        public string EncryptRouteData(double fromLat, double fromLon, double toLat, double toLon)
        {
            try
            {
                var routeData = new RouteShareData
                {
                    FromLat = fromLat,
                    FromLon = fromLon,
                    ToLat = toLat,
                    ToLon = toLon,
                    CreatedAt = DateTime.UtcNow
                };

                var jsonData = JsonSerializer.Serialize(routeData);
                var encryptedBytes = EncryptString(jsonData, _encryptionKey);
                
                // Convert to URL-safe base64
                return Convert.ToBase64String(encryptedBytes)
                    .Replace('+', '-')
                    .Replace('/', '_')
                    .Replace("=", "");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hiba az útvonal adatok titkosításában");
                throw;
            }
        }

        public RouteShareData? DecryptRouteData(string encryptedData)
        {
            try
            {
                // Convert from URL-safe base64
                var base64 = encryptedData
                    .Replace('-', '+')
                    .Replace('_', '/');
                
                // Add padding if needed
                switch (base64.Length % 4)
                {
                    case 2: base64 += "=="; break;
                    case 3: base64 += "="; break;
                }

                var encryptedBytes = Convert.FromBase64String(base64);
                var decryptedJson = DecryptString(encryptedBytes, _encryptionKey);
                
                var routeData = JsonSerializer.Deserialize<RouteShareData>(decryptedJson);
                
                // Validate coordinates
                if (routeData != null && IsValidCoordinate(routeData.FromLat, routeData.FromLon) && 
                    IsValidCoordinate(routeData.ToLat, routeData.ToLon))
                {
                    return routeData;
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hiba az útvonal adatok visszafejtésében");
                return null;
            }
        }

        private static byte[] EncryptString(string plainText, string key)
        {
            using var aes = Aes.Create();
            aes.Key = GetValidKey(key);
            aes.GenerateIV();

            using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
            using var msEncrypt = new MemoryStream();
            
            // Write IV first
            msEncrypt.Write(aes.IV, 0, aes.IV.Length);
            
            using (var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
            using (var swEncrypt = new StreamWriter(csEncrypt))
            {
                swEncrypt.Write(plainText);
            }
            
            return msEncrypt.ToArray();
        }

        private static string DecryptString(byte[] cipherText, string key)
        {
            using var aes = Aes.Create();
            aes.Key = GetValidKey(key);

            // Extract IV from the beginning
            var iv = new byte[aes.BlockSize / 8];
            Array.Copy(cipherText, 0, iv, 0, iv.Length);
            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            using var msDecrypt = new MemoryStream(cipherText, iv.Length, cipherText.Length - iv.Length);
            using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
            using var srDecrypt = new StreamReader(csDecrypt);
            
            return srDecrypt.ReadToEnd();
        }

        private static byte[] GetValidKey(string key)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var validKey = new byte[32]; // 256-bit key for AES
            
            if (keyBytes.Length >= 32)
            {
                Array.Copy(keyBytes, validKey, 32);
            }
            else
            {
                Array.Copy(keyBytes, validKey, keyBytes.Length);
                // Fill remaining bytes with hash of original key
                using var sha = SHA256.Create();
                var hash = sha.ComputeHash(keyBytes);
                Array.Copy(hash, 0, validKey, keyBytes.Length, Math.Min(hash.Length, 32 - keyBytes.Length));
            }
            
            return validKey;
        }

        private static bool IsValidCoordinate(double lat, double lon)
        {
            return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
        }
    }
}