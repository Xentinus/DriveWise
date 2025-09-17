# DriveWise Weather Widget

## Weather API Integráció

Az alkalmazás OpenWeatherMap API-t használ az aktuális időjárási adatok lekéréséhez.

### API Kulcs Beállítása

1. Menj a [OpenWeatherMap](https://openweathermap.org/api) oldalra
2. Regisztrálj egy ingyenes fiókot
3. Szerezz egy API kulcsot
4. Másold le az `appsettings.Example.json` fájlt `appsettings.json` néven
5. Frissítsd az `appsettings.json` fájlt a saját API kulcsoddal:

```json
{
  "OpenWeatherMap": {
    "ApiKey": "YOUR_ACTUAL_API_KEY_HERE"
  }
}
```

**Fontos:** Az `appsettings.json` fájl a `.gitignore`-ban van, így az API kulcsod nem kerül fel a GitHubra.

### Demo Mód

Ha nincs API kulcs beállítva (vagy "demo_key"-t használsz), az alkalmazás mock adatokat fog visszaadni:
- Reális hőmérséklet értékek a koordináták alapján
- Magyar időjárás leírások
- Ismert magyar városok felismerése

### Weather Widget Funkciók

- **Automatikus GPS pozíció**: A widget automatikusan lekéri a felhasználó aktuális pozícióját
- **10 perces frissítés**: Az időjárási adatok automatikusan frissülnek 10 percenként
- **Fallback koordináták**: Ha a GPS nem elérhető, Budapest koordinátáit használja
- **Reszponzív design**: Mobil barát megjelenés
- **Sötét téma támogatás**: Automatikus téma váltás

### API Végpont

```
GET /api/weather?lat={latitude}&lon={longitude}
```

**Példa válasz:**
```json
{
  "temperature": 19.0,
  "condition": "Clouds",
  "description": "borult",
  "icon": "03d",
  "humidity": 47.0,
  "windSpeed": 0.0,
  "locationName": "Budapest",
  "lastUpdated": "2025-09-17T18:06:47.936045Z"
}
```

### CSS Classes

A weather widget a következő CSS osztályokat használja:
- `.weather-widget`: Fő kontainer (jobb felső sarok)
- `.weather-container`: Belső kártya stílus
- `.weather-main`: Ikon és hőmérséklet sor
- `.weather-condition`: Időjárás leírás
- `.weather-location`: Helységnév

### JavaScript API

```javascript
// Weather widget pozíció frissítése
window.updateWeatherLocation(lat, lng);

// Widget referencia
window.weatherWidget
```