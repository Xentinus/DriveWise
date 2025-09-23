# DriveWise Docker Deployment

Ez a dokumentum leírja, hogyan futtathatod a DriveWise alkalmazást Docker konténerben.

## Előfeltételek

- Docker telepítve van a gépedre
- Docker Compose telepítve van (általában a Docker-rel együtt érkezik)

## Futtatás Docker-rel

### 1. Egyszerű futtatás (ajánlott)

```bash
# Futtatás a kész scripttel
./run-docker.sh

# Leállítás
./stop-docker.sh
```

### 2. Multi-platform build (AMD64 + ARM64)

```bash
# Build mindkét architektúrához (Desktop + Raspberry Pi)
./build-multiarch.sh

# Registry push verzió (opcionális)
./build-registry.sh
```

### 4. Docker Compose használata

```bash
# Alkalmazás építése és futtatása egy lépésben
docker-compose up --build

# Vagy háttérben futtatás
docker-compose up --build -d

# Leállítás
docker-compose down
```

### 5. Manuális Docker parancsok

```bash
# Docker image építése
docker build -t drivewise .

# Konténer futtatása
docker run -p 8800:8800 --name drivewise-app drivewise
```

### 6. Alkalmazás elérése

Az alkalmazás a következő címen érhető el:
- **http://localhost:8800**

## Támogatott platformok

### Desktop platformok (AMD64)
- Intel/AMD processzoros Linux
- Intel/AMD processzoros macOS
- Windows (Docker Desktop-pal)

### ARM64 platformok
- Apple Silicon Mac (M1/M2/M3)
- Raspberry Pi 4/5 (64-bit OS)
- ARM64 Linux szerverek

### Fájlok mérete
- AMD64 image: ~98MB
- ARM64 image: ~96MB (tar fájlban)

## Raspberry Pi specifikus használat

Lásd a részletes útmutatót: [`RASPBERRY_PI_INSTALL.md`](RASPBERRY_PI_INSTALL.md)

## Hasznos Docker parancsok

```bash
# Futó konténerek listázása
docker ps

# Alkalmazás logok megtekintése
docker-compose logs -f

# Konténer leállítása
docker-compose down

# Konténer újraindítása
docker-compose restart

# Mindent törölni (konténer, image, volume)
docker-compose down --rmi all --volumes
```

## Produkciós beállítások

Az alkalmazás Production módban fut a Docker konténerben. A következő környezeti változók vannak beállítva:

- `ASPNETCORE_ENVIRONMENT=Production`
- `ASPNETCORE_URLS=http://+:8800`

## Hibaelhárítás

### Port már használatban van
Ha a 8800-as port már használatban van, módosítsd a `docker-compose.yml` fájlban:

```yaml
ports:
  - "8801:8800"  # Host port megváltoztatása
```

### Logs megtekintése
```bash
docker-compose logs drivewise
```

### Konténerbe belépés debug céljából
```bash
docker exec -it drivewise-app /bin/bash
```