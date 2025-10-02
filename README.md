# DriveWise

![DriveWise Logo](.github/logo.png)

**DriveWise** - Intelligens útvonaltervező alkalmazás üzemanyagköltség-optimalizálással, valós idejű időjárás adatokkal és fejlett jármű-menedzsmenttel.

## 🚗 Funkciók

- **🗺️ Intelligens útvonaltervezés** - Optimális útvonalak számítása valós forgalmi adatokkal
- **⛽ Üzemanyagköltség-kalkulátor** - Valós idejű üzemanyagárak és fogyasztási számítások
- **🌤️ Időjárás integráció** - Aktuális időjárási viszonyok az útvonal mentén
- **🚙 Jármű-menedzsment** - Többféle jármű profil kezelése egyedi fogyasztási adatokkal
- **📱 Progressive Web App (PWA)** - Mobilbarát felület offline támogatással
- **🎨 Sötét/világos téma** - Automatikus és manuális témaváltás
- **📍 GPS alapú helymeghatározás** - Automatikus kiindulópont felismerés

## 🛠️ Technológiai stack

- **Backend**: ASP.NET Core 9.0 (C#)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **API-k**: OpenWeatherMap, OSRM (útvonaltervezés), holtankoljak.hu (üzemanyagárak)
- **Konténerizáció**: Docker & Docker Compose
- **Platformok**: Windows, macOS, Linux, Raspberry Pi (ARM64)

## 🚀 Gyors indítás

### Docker használatával (ajánlott)

1. **Repository klónozása**
   ```bash
   git clone https://github.com/Xentinus/DriveWise.git
   cd DriveWise
   ```

2. **Alkalmazás futtatása**
   ```bash
   ./run-docker.sh
   ```

3. **Böngészőben megnyitás**
   ```
   http://localhost:8800
   ```

### Fejlesztői környezet

1. **Előfeltételek**
   - .NET 9.0 SDK
   - OpenWeatherMap API kulcs (opcionális, demo módhoz nem szükséges)

2. **Projekt futtatása**
   ```bash
   dotnet restore
   dotnet run
   ```

## ⚙️ Konfiguráció

### Időjárás API beállítása

1. Szerezz egy ingyenes API kulcsot az [OpenWeatherMap](https://openweathermap.org/api) oldalról
2. Másold le az `appsettings.Example.json` fájlt `appsettings.json` néven
3. Frissítsd az API kulcsot:

```json
{
  "OpenWeatherMap": {
    "ApiKey": "YOUR_ACTUAL_API_KEY_HERE"
  }
}
```

**Megjegyzés**: API kulcs nélkül az alkalmazás mock adatokat használ.

## 🐳 Docker telepítési opciók

### Egyszerű futtatás
```bash
# Alkalmazás indítása
./run-docker.sh

# Alkalmazás leállítása
./stop-docker.sh
```

### Docker Compose
```bash
# Háttérben futtatás
docker-compose up -d --build

# Leállítás
docker-compose down
```

### Multi-platform build
```bash
# AMD64 + ARM64 build egyidejűleg
./build-multiarch.sh
```

## 🍓 Raspberry Pi telepítés

A DriveWise natívan támogatja a Raspberry Pi platformot.

### Előfeltételek

#### Raspberry Pi követelmények:
- **Raspberry Pi 4 vagy újabb** (min. 2GB RAM ajánlott)
- **Raspberry Pi OS 64-bit** telepítve
- **Docker telepítve** a Raspberry Pi-on

#### Docker telepítése Raspberry Pi-ra:

```bash
# System frissítése
sudo apt update && sudo apt upgrade -y

# Docker telepítése
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose telepítése
sudo apt install -y docker-compose

# Felhasználó hozzáadása a docker csoporthoz
sudo usermod -aG docker $USER

# Újraindítás szükséges a csoport változtatáshoz
sudo reboot
```

### DriveWise telepítése Raspberry Pi-ra

#### Módszer 1: ARM64 image fájl átvitele

1. **ARM64 image létrehozása** (fejlesztői gépen):
   ```bash
   ./build-multiarch.sh
   ```

2. **Fájl átvitele** Raspberry Pi-ra:
   ```bash
   # A fejlesztői gépen
   scp drivewise-arm64-*.tar pi@your-pi-ip:~/
   ```

3. **Image betöltése** a Raspberry Pi-n:
   ```bash
   # A Raspberry Pi-n
   docker load < drivewise-arm64-*.tar
   ```

4. **Docker-compose fájl átvitele**:
   ```bash
   # A fejlesztői gépen
   scp docker-compose.rpi.yml pi@your-pi-ip:~/docker-compose.yml
   ```

5. **Alkalmazás indítása** a Raspberry Pi-n:
   ```bash
   # A Raspberry Pi-n
   docker-compose up -d
   ```

#### Módszer 2: Registry használata (ha van)

Ha feltöltötted a registry-be a `build-registry.sh` scripttel:

```bash
# A Raspberry Pi-n
docker pull yourusername/drivewise:latest
docker run -p 8800:8800 --name drivewise-rpi -d yourusername/drivewise:latest
```

### Elérhetőség

Az alkalmazás elérhető lesz a Raspberry Pi IP címén:
- **http://[raspberry-pi-ip]:8800**

Például: `http://192.168.1.100:8800`

### Hasznos parancsok Raspberry Pi-n

```bash
# Konténer állapotának ellenőrzése
docker ps

# Logok megtekintése
docker logs drivewise-rpi

# Konténer újraindítása
docker restart drivewise-rpi

# Konténer leállítása
docker stop drivewise-rpi

# System erőforrások ellenőrzése
htop
free -h
df -h

# Hálózat ellenőrzése
ip addr show
```

### Teljesítmény optimalizálás

#### Raspberry Pi 4 (4GB+ RAM):
```yaml
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

#### Raspberry Pi 4 (2GB RAM):
```yaml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

### Raspberry Pi hibaelhárítás

#### Memória problémák:
```bash
# Swap fájl növelése
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# CONF_SWAPSIZE=1024
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

#### Hálózati problémák:
```bash
# Tűzfal ellenőrzése
sudo ufw status
sudo ufw allow 8800

# Port ellenőrzése
sudo netstat -tulpn | grep 8800
```

#### Docker problémák:
```bash
# Docker szolgáltatás újraindítása
sudo systemctl restart docker

# Docker log szint csökkentése
sudo nano /etc/docker/daemon.json
# {"log-level": "warn"}
sudo systemctl restart docker
```

### Automatikus indítás

A `restart: unless-stopped` beállítás biztosítja, hogy az alkalmazás automatikusan elinduljon a Raspberry Pi újraindításakor.

### Biztonsági javaslatok

1. **Változtasd meg az alapértelmezett jelszót** a Raspberry Pi-n
2. **Engedélyezd az SSH kulcs autentikációt**
3. **Tűzfal konfigurálása**:
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 8800
   ```
4. **Rendszeres frissítések**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```



## 🌐 API végpontok

### Útvonaltervezés
```http
POST /api/routing/route
Content-Type: application/json

{
  "fromLat": 47.4979,
  "fromLon": 19.0402,
  "toLat": 47.5,
  "toLon": 19.05,
  "vehicle": {
    "name": "Autó",
    "fuelType": "benzin",
    "consumption": 7.0
  }
}
```

### Üzemanyagárak
```http
GET /api/fuelprice
GET /api/fuelprice/benzin
POST /api/fuelprice/calculate-cost
```

### Időjárás
```http
GET /api/weather?lat=47.4979&lon=19.0402
```

### Helyek keresése
```http
GET /api/location/search?query=Budapest
GET /api/location/details?lat=47.4979&lon=19.0402
```

## 📁 Projekt felépítés

```
DriveWise/
├── Controllers/          # API kontrollerek
│   ├── FuelPriceController.cs
│   ├── RoutingController.cs
│   ├── WeatherController.cs
│   └── LocationController.cs
├── Services/            # Üzleti logika szolgáltatások
│   ├── FuelPriceService.cs
│   ├── RoutingService.cs
│   ├── WeatherService.cs
│   └── VehicleService.cs
├── Models/              # Adatmodellek
│   ├── Vehicle.cs
│   ├── WeatherData.cs
│   └── LocationModels.cs
├── BackgroundServices/  # Háttérszolgáltatások
│   └── FuelPriceBackgroundService.cs
├── Views/               # Frontend nézetek
│   └── Home/
├── wwwroot/            # Statikus fájlok
│   ├── css/
│   ├── js/
│   └── manifest.json
└── Docker/             # Konténerizációs fájlok
```

## 🔧 Fejlesztői parancsok

```bash
# Projekt build
dotnet build

# Tesztek futtatása
dotnet test

# Publikálás
dotnet publish

# Watch mód (automatikus újraindítás)
dotnet watch run
```

### VS Code feladatok
```bash
# Build task futtatása
Ctrl+Shift+P → "Tasks: Run Task" → "build"

# Watch mód indítása
Ctrl+Shift+P → "Tasks: Run Task" → "watch"
```

## 🌍 Hálózati követelmények

### Külső API Függőségek

A DriveWise alkalmazás számos külső webes szolgáltatást használ, ezért internetkapcsolat és bizonyos portokhoz való hozzáférés szükséges.

#### Szükséges Kimenő Kapcsolatok

**HTTP/HTTPS Portok**
- **Port 80** (HTTP) - Alapvető webes API hívások
- **Port 443** (HTTPS) - Titkosított API hívások
- **Port 8800** - Alkalmazás elérése (konfigurálható)

#### Használt Külső Szolgáltatások

1. **Üzemanyagárak** - `holtankoljak.hu`
   - Protokoll: HTTPS (443)
   - Frissítési gyakoriság: Automatikus háttérszolgáltatás
   - Cél: Aktuális üzemanyagárak lekérdezése

2. **Időjárás API** - `api.openweathermap.org`
   - Protokoll: HTTPS (443)
   - Használat: Útvonal tervezéskor időjárási adatok
   - Típus: REST API

3. **Helymeghatározó Szolgáltatások**
   - Protokoll: HTTPS (443)
   - Használat: Címek geocoding-ja, helyek keresése
   - Típus: RESTful API

4. **Útvonaltervező API** - `router.project-osrm.org`
   - Protokoll: HTTPS (443)
   - Használat: Optimális útvonalak számítása
   - Típus: Routing API

### Docker Hálózati Konfiguráció

#### Alapértelmezett Beállítások
Docker konténerek alapértelmezetten hozzáférnek az internethez, de explicit módon biztosítjuk:

```yaml
# docker-compose.yml
services:
  drivewise:
    network_mode: "bridge"  # Alapértelmezett bridge hálózat
```

#### Docker Run Parancs
```bash
docker run -d -p 8800:8800 --network bridge --name drivewise-app drivewise
```

### Tűzfal Beállítások

#### Linux/Raspberry Pi
```bash
# UFW tűzfal beállítása
sudo ufw allow out 80/tcp
sudo ufw allow out 443/tcp
sudo ufw allow in 8800/tcp

# Vagy iptables
sudo iptables -A OUTPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8800 -j ACCEPT
```

#### Windows/macOS
Docker Desktop automatikusan kezeli a kimenő kapcsolatokat.

### Hálózati Diagnosztika

#### Konténer Hálózati Tesztelése
```bash
# Konténerbe belépés
docker exec -it drivewise-app /bin/bash

# DNS feloldás tesztelése
nslookup holtankoljak.hu

# HTTP kapcsolat tesztelése
curl -I https://holtankoljak.hu

# Hálózati interfészek
ip addr show

# Útvonalak ellenőrzése
ip route
```

#### Alkalmazás Logok Ellenőrzése
```bash
# HTTP hívások nyomon követése
docker logs -f drivewise-app | grep -i "http"

# API hívások keresése
docker logs drivewise-app | grep -E "(holtankoljak|weather|routing)"
```

### Hálózati hibaelhárítás

#### Gyakori Problémák

1. **API hívások sikertelenül**
   ```bash
   # Ellenőrizd a DNS-t
   docker exec drivewise-app nslookup google.com
   
   # Ellenőrizd a kimenő kapcsolatokat
   docker exec drivewise-app curl -I https://httpbin.org/get
   ```

2. **Proxy környezetben**
   ```yaml
   # docker-compose.yml
   environment:
     - HTTP_PROXY=http://proxy:8080
     - HTTPS_PROXY=http://proxy:8080
     - NO_PROXY=localhost,127.0.0.1
   ```

3. **Vállalati tűzfal**
   - Engedélyezd a kimenő HTTPS forgalmat
   - Whitelist-eld a használt domaineket
   - SSL-bumping esetén gondoskodj a tanúsítványokról

#### Log Szintek
```bash
# Részletes HTTP logok engedélyezése
docker run -e Logging__LogLevel__Default=Debug drivewise
```

### Biztonsági Megfontolások

1. **Minimális jogosultságok**
   - Csak szükséges portok nyitása
   - Konténer nem-root userként futtatása

2. **Hálózati szegmentáció**
   - Külön Docker network használata
   - Database és cache elkülönítése

3. **Monitoring**
   - Kimenő kapcsolatok figyelése
   - Abnormális forgalom detektálása

### Raspberry Pi Hálózati Specifikus

#### Korlátozott erőforrások
```yaml
# docker-compose.rpi.yml
services:
  drivewise:
    sysctls:
      - net.core.somaxconn=1024
    ulimits:
      nofile: 65536
```

#### Hálózati optimalizálás
```bash
# Raspberry Pi-n
echo 'net.core.rmem_max = 16777216' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 16777216' >> /etc/sysctl.conf
sudo sysctl -p
```



## 🐛 Hibaelhárítás

### Gyakori problémák

**Port már használatban van**
```bash
# Port módosítása a docker-compose.yml fájlban
ports:
  - "8801:8800"  # 8800 helyett 8801
```

**API hibák**
```bash
# Alkalmazás logok megtekintése
docker logs -f drivewise-app

# Vagy docker-compose esetén
docker-compose logs -f
```

**Üzemanyagár API nem elérhető**
- Az alkalmazás automatikusan fallback adatokat használ
- A háttérszolgáltatás 30 percenként próbálkozik újra

### Debug módok

```bash
# Fuel price teszt
curl http://localhost:8800/api/debug/test-fuel

# Útvonal teszt
curl http://localhost:8800/api/debug/test-route

# Frontend szimuláció
curl http://localhost:8800/api/debug/simulate-frontend-data
```

## 📱 PWA funkciók

- **Offline működés**: Service Worker cache-eléssel
- **Installálható**: "Add to Home Screen" támogatás
- **Reszponzív**: Mobil-first design
- **App-szerű élmény**: Natív alkalmazás feeling

## 🎨 Testreszabhatóság

### Témák
- Automatikus sötét/világos mód
- Rendszer téma követése
- Kézi témaváltás lehetőség

### Járművek
- Egyedi fogyasztási profilok
- Különböző üzemanyagtípusok
- Városi/országúti/vegyes útvonal kalkulációk

## 📄 Licenc

Ez a projekt a [MIT Licenc](LICENSE) alatt áll.

## 🤝 Közreműködés

1. Fork-old a repositoryt
2. Készíts egy feature branch-et (`git checkout -b feature/AmazingFeature`)
3. Commit-old a változásokat (`git commit -m 'Add some AmazingFeature'`)
4. Push-old a branch-et (`git push origin feature/AmazingFeature`)
5. Nyiss egy Pull Request-et

## 📞 Támogatás

Ha problémába ütközöl vagy kérdésed van:

1. Ellenőrizd a [hibaelhárítási útmutatót](#-hibaelhárítás)
2. Nézd át a meglévő [Issues](https://github.com/Xentinus/DriveWise/issues) listát
3. Nyiss egy új Issue-t részletes leírással

## 🔄 Changelog

### v1.0.0
- ✅ Alapvető útvonaltervezés
- ✅ Üzemanyagköltség kalkuláció
- ✅ Időjárás integráció
- ✅ PWA támogatás
- ✅ Docker konténerizáció
- ✅ Raspberry Pi ARM64 támogatás

---

## 🔧 DriveWise Egységesített Management Script

### Áttekintés

A DriveWise projektet egy egységesített `drivewise.sh` scripttel kezelheted, amely minden Docker és deployment műveletet egy helyen tartalmaz interaktív menüvel.

### 🚀 Gyors Kezdés

#### 1. Környezet Beállítása

Először másold le a `.env.example` fájlt `.env` néven és töltsd ki a saját adataiddal:

```bash
cp .env.example .env
nano .env  # vagy bármilyen szövegszerkesztő
```

A `.env` fájlban állítsd be:
- `RPI_HOST`: Raspberry Pi IP címe
- `RPI_USER`: Raspberry Pi felhasználónév
- `RPI_PASSWORD`: Raspberry Pi jelszó
- `IMAGE_NAME`: Docker image neve (alapértelmezett: drivewise)
- `CONTAINER_NAME`: Docker container neve
- `CONTAINER_PORT`: Alkalmazás portja (alapértelmezett: 8800)
- `REGISTRY`: Docker registry (opcionális)

#### 2. Script Futtatása

```bash
./drivewise.sh
```

### 📋 Elérhető Funkciók

Az interaktív menü 10 opcióval rendelkezik:

#### 1. 🏗️ Build local (AMD64)
Helyi AMD64 Docker image készítése desktop használatra (macOS Intel/AMD, Linux x86).

```bash
# Automatikus build
./drivewise.sh
# Válaszd: 1
```

#### 2. 🚀 Run local
Helyi Docker container indítása. Ha nincs image, automatikusan buildelődik.
- Port: `http://localhost:8800` (vagy amit beállítottál)
- Automatikusan leállítja és újraindítja, ha már fut

```bash
# Gyors indítás
./drivewise.sh
# Válaszd: 2
```

#### 3. 🛑 Stop local
Helyi container leállítása és eltávolítása.

#### 4. 📦 Build multi-arch
Multi-architektúra build (AMD64 + ARM64):
- **AMD64**: helyi használatra betöltődik
- **ARM64**: `.tar` fájlba exportálódik Raspberry Pi-re való átmásoláshoz

```bash
# Multi-platform build
./drivewise.sh
# Válaszd: 4
```

#### 5. 🌐 Build & push to registry
Build és push Docker registry-be (Docker Hub, GitHub Container Registry, stb.)
- Multi-architektúra támogatás
- Automatikus verzió címkézés

#### 6. 🍓 Deploy to Raspberry Pi
**Teljes automatikus telepítés Raspberry Pi-re:**

1. ARM64 image buildelése
2. SSH kapcsolat tesztelése
3. Image feltöltése Pi-re
4. Régi containerek és image-ek törlése
5. Új container indítása
6. Health check és log ellenőrzés

**A deploy során:**
- Automatikusan települ a `sshpass` ha hiányzik (Homebrew-val)
- Hálózati tesztek futnak
- HTTP endpoint ellenőrzés
- Részletes hibajelzések

```bash
# Egyetlen parancs az egész deployment-hez!
./drivewise.sh
# Válaszd: 6
```

#### 7. 📋 View logs
Logok megtekintése:
- Helyi container
- Raspberry Pi container

#### 8. 🔍 Check status
Státusz ellenőrzés:
- Helyi container állapota
- Raspberry Pi container állapota

#### 9. 🧹 Clean up
Takarítási opciók:
- Csak helyi
- Csak Raspberry Pi
- Mindkettő
- Mélyreható tisztítás (image-ekkel együtt)

#### 0. ❌ Exit
Kilépés a scriptből.

### 🔧 Előfeltételek

#### Helyi Gép (macOS/Linux)

```bash
# Docker Desktop telepítése
# https://www.docker.com/products/docker-desktop

# Homebrew (macOS) - sshpass telepítéséhez
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# sshpass - automatikusan települ, de manuálisan is lehet:
brew install hudochenkov/sshpass/sshpass
```

#### Raspberry Pi

```bash
# Docker telepítése
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# SSH engedélyezése
sudo systemctl enable ssh
sudo systemctl start ssh
```

### 📝 Példa Használat

#### Első Alkalommal - Teljes Setup

```bash
# 1. .env fájl létrehozása
cp .env.example .env
nano .env

# 2. Script futtatása
./drivewise.sh

# 3. Válaszd a "6" opciót (Deploy to Raspberry Pi)
# A script mindent elvégez automatikusan!
```

#### Helyi Fejlesztés

```bash
./drivewise.sh

# Válaszd:
# 1 - Build local
# 2 - Run local
# 7 - Logok megtekintése
```

#### Frissítés Raspberry Pi-n

```bash
./drivewise.sh

# Válaszd:
# 6 - Deploy to Raspberry Pi
# Automatikusan buildelődik és települ az új verzió
```

### 🔐 Biztonság

- A `.env` fájl **NINCS** commitolva a git-be
- Csak a `.env.example` van verziókezelve
- Soha ne oszd meg a `.env` fájlt vagy commitold git-be!

### 🐛 Hibaelhárítás

#### SSH kapcsolat hiba

```bash
# Teszteld manuálisan:
ssh user@raspberry-pi-ip

# Ellenőrizd:
# - Helyes IP cím
# - SSH fut a Pi-n
# - Helyes felhasználónév/jelszó
```

#### Docker nem fut

```bash
# Ellenőrizd, hogy a Docker Desktop fut-e
docker info

# Ha nem, indítsd el a Docker Desktop alkalmazást
```

#### Port már használatban

```bash
# Ellenőrizd, mi használja a portot:
lsof -i :8800

# Állítsd le az ütköző szolgáltatást vagy változtasd meg a portot a .env-ben
```

#### ARM64 build hiba

```bash
# Buildx builder újralétrehozása:
docker buildx rm drivewise-multiarch
docker buildx create --name drivewise-multiarch --platform linux/amd64,linux/arm64 --use
```

### 📚 További Információk

#### Hasznos Docker parancsok

```bash
# Container logok
docker logs -f drivewise-app

# Container shell
docker exec -it drivewise-app /bin/bash

# Image lista
docker images | grep drivewise

# Container újraindítás
docker restart drivewise-app
```

#### Raspberry Pi távoli parancsok

```bash
# SSH kapcsolat a .env adataival
ssh user@raspberry-pi-ip

# Docker status Pi-n
ssh user@raspberry-pi-ip 'docker ps'

# Logok Pi-ről
ssh user@raspberry-pi-ip 'docker logs drivewise-app'
```

### 🎯 Tippek

1. **Első futtatás**: Mindig az "1" vagy "6" opcióval kezdj (build vagy deploy)
2. **Fejlesztés közben**: Használd a helyi build és run opciókat (1-2)
3. **Éles környezet**: Deploy to Pi (6) automatikusan mindent elintéz
4. **Logok**: Használd a "7" opciót problémák diagnosztizálásához
5. **Takarítás**: A "9" opció szabad helyet biztosít

### 🔄 Migráció Régi Scriptekről

Ha korábban használtad az egyedi scripteket (`run-docker.sh`, `deploy-to-rpi.sh`, stb.), most már mind egyben vannak:

| Régi Script | Új Menüpont |
|-------------|-------------|
| `run-docker.sh` | 1 (Build local) + 2 (Run local) |
| `stop-docker.sh` | 3 (Stop local) |
| `build-multiarch.sh` | 4 (Build multi-arch) |
| `build-registry.sh` | 5 (Build & push to registry) |
| `deploy-to-rpi.sh` | 6 (Deploy to Raspberry Pi) |
| *új* | 7 (View logs) |
| *új* | 8 (Check status) |
| *új* | 9 (Clean up) |

### ✨ Új Funkciók a Régi Scriptekhez Képest

1. ✅ **Interaktív menü** - könnyű navigáció
2. ✅ **Színes output** - könnyebb olvashatóság
3. ✅ **Egységes konfiguráció** - minden egy `.env` fájlban
4. ✅ **Log viewer** - helyi és távoli logok
5. ✅ **Status checker** - gyors állapot ellenőrzés
6. ✅ **Cleanup opciók** - rugalmas takarítás
7. ✅ **Hibakezelés** - részletes hibaüzenetek
8. ✅ **Automatikus prerequisite check** - Docker, sshpass stb.
9. ✅ **Biztonság** - nincs jelszó a git-ben

---

**DriveWise** - *Okos utazás, optimális költségekkel.* 🚗✨