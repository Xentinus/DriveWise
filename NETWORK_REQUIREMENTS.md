# DriveWise Hálózati Követelmények

## Külső API Függőségek

A DriveWise alkalmazás számos külső webes szolgáltatást használ, ezért internetkapcsolat és bizonyos portokhoz való hozzáférés szükséges.

### Szükséges Kimenő Kapcsolatok

#### HTTP/HTTPS Portok
- **Port 80** (HTTP) - Alapvető webes API hívások
- **Port 443** (HTTPS) - Titkosított API hívások

#### Használt Külső Szolgáltatások

1. **Üzemanyagárak** - `holtankoljak.hu`
   - Protokoll: HTTPS (443)
   - Frissítési gyakoriság: Automatikus háttérszolgáltatás
   - Cél: Aktuális üzemanyagárak lekérdezése

2. **Időjárás API**
   - Protokoll: HTTPS (443)
   - Használat: Útvonal tervezéskor időjárási adatok
   - Típus: REST API

3. **Helymeghatározó Szolgáltatások**
   - Protokoll: HTTPS (443)
   - Használat: Címek geocoding-ja, helyek keresése
   - Típus: RESTful API

4. **Útvonaltervező API**
   - Protokoll: HTTPS (443)
   - Használat: Optimális útvonalak számítása
   - Típus: Routing API

## Docker Hálózati Konfiguráció

### Alapértelmezett Beállítások
Docker konténerek alapértelmezetten hozzáférnek az internethez, de explicit módon biztosítjuk:

```yaml
# docker-compose.yml
services:
  drivewise:
    network_mode: "bridge"  # Alapértelmezett bridge hálózat
```

### Docker Run Parancs
```bash
docker run -d -p 8800:8800 --network bridge --name drivewise-app drivewise
```

## Tűzfal Beállítások

### Linux/Raspberry Pi
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

### Windows/macOS
Docker Desktop automatikusan kezeli a kimenő kapcsolatokat.

## Hálózati Diagnosztika

### Konténer Hálózati Tesztelése
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

### Alkalmazás Logok Ellenőrzése
```bash
# HTTP hívások nyomon követése
docker logs -f drivewise-app | grep -i "http"

# API hívások keresése
docker logs drivewise-app | grep -E "(holtankoljak|weather|routing)"
```

## Hibaelhárítás

### Gyakori Problémák

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

### Log Szintek
```bash
# Részletes HTTP logok engedélyezése
docker run -e Logging__LogLevel__Default=Debug drivewise
```

## Biztonsági Megfontolások

1. **Minimális jogosultságok**
   - Csak szükséges portok nyitása
   - Konténer nem-root userként futtatása

2. **Hálózati szegmentáció**
   - Külön Docker network használata
   - Database és cache elkülönítése

3. **Monitoring**
   - Kimenő kapcsolatok figyelése
   - Abnormális forgalom detektálása

## Raspberry Pi Specifikus

### Korlátozott erőforrások
```yaml
# docker-compose.rpi.yml
services:
  drivewise:
    sysctls:
      - net.core.somaxconn=1024
    ulimits:
      nofile: 65536
```

### Hálózati optimalizálás
```bash
# Raspberry Pi-n
echo 'net.core.rmem_max = 16777216' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 16777216' >> /etc/sysctl.conf
sudo sysctl -p
```