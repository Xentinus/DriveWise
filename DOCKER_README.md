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

### 2. Docker Compose használata

```bash
# Alkalmazás építése és futtatása egy lépésben
docker-compose up --build

# Vagy háttérben futtatás
docker-compose up --build -d

# Leállítás
docker-compose down
```

### 3. Manuális Docker parancsok

```bash
# Docker image építése
docker build -t drivewise .

# Konténer futtatása
docker run -p 8800:8800 --name drivewise-app drivewise
```

### 4. Alkalmazás elérése

Az alkalmazás a következő címen érhető el:
- **http://localhost:8800**

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