# DriveWise Raspberry Pi Telepítési Útmutató

## Előfeltételek

### Raspberry Pi követelmények:
- **Raspberry Pi 4 vagy újabb** (min. 2GB RAM ajánlott)
- **Raspberry Pi OS 64-bit** telepítve
- **Docker telepítve** a Raspberry Pi-on

### Docker telepítése Raspberry Pi-ra:

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

## DriveWise telepítése Raspberry Pi-ra

### Módszer 1: ARM64 image fájl átvitele

1. **Készítsd el az ARM64 image-et** a fejlesztői gépen:
   ```bash
   ./build-multiarch.sh
   ```

2. **Másold át a .tar fájlt** a Raspberry Pi-ra:
   ```bash
   # A fejlesztői gépen
   scp drivewise-arm64-*.tar pi@your-pi-ip:~/
   ```

3. **Töltsd be az image-et** a Raspberry Pi-n:
   ```bash
   # A Raspberry Pi-n
   docker load < drivewise-arm64-*.tar
   ```

4. **Másold át a Raspberry Pi docker-compose fájlt**:
   ```bash
   # A fejlesztői gépen
   scp docker-compose.rpi.yml pi@your-pi-ip:~/docker-compose.yml
   ```

5. **Indítsd el az alkalmazást** a Raspberry Pi-n:
   ```bash
   # A Raspberry Pi-n
   docker-compose up -d
   ```

### Módszer 2: Registry használata (ha van)

Ha feltöltötted a registry-be a `build-registry.sh` scripttel:

```bash
# A Raspberry Pi-n
docker pull yourusername/drivewise:latest
docker run -p 8800:8800 --name drivewise-rpi -d yourusername/drivewise:latest
```

## Elérhetőség

Az alkalmazás elérhető lesz a Raspberry Pi IP címén:
- **http://[raspberry-pi-ip]:8800**

Például: `http://192.168.1.100:8800`

## Hasznos parancsok Raspberry Pi-n

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

## Teljesítmény optimalizálás

### Raspberry Pi 4 (4GB+ RAM):
```yaml
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

### Raspberry Pi 4 (2GB RAM):
```yaml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

## Hibaelhárítás

### Memória problémák:
```bash
# Swap fájl növelése
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# CONF_SWAPSIZE=1024
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Hálózati problémák:
```bash
# Tűzfal ellenőrzése
sudo ufw status
sudo ufw allow 8800

# Port ellenőrzése
sudo netstat -tulpn | grep 8800
```

### Docker problémák:
```bash
# Docker szolgáltatás újraindítása
sudo systemctl restart docker

# Docker log szint csökkentése
sudo nano /etc/docker/daemon.json
# {"log-level": "warn"}
sudo systemctl restart docker
```

## Automatikus indítás

A `restart: unless-stopped` beállítás biztosítja, hogy az alkalmazás automatikusan elinduljon a Raspberry Pi újraindításakor.

## Biztonsági javaslatok

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