# 📝 Todo App — Cloud Full-Stack Deployment (Final Project)

Aplikasi Todo List full-stack (Node.js/Express + SQLite + vanilla JS) yang di-deploy
ke VM Ubuntu (VMware, local) lengkap dengan CI/CD, security hardening, monitoring,
dan konfigurasi scaling.

## 🧱 Tech Stack

| Layer        | Teknologi                              |
|--------------|-----------------------------------------|
| Backend      | Node.js, Express                        |
| Database     | SQLite (better-sqlite3)                 |
| Frontend     | HTML/CSS/JavaScript (vanilla)           |
| Container    | Docker, Docker Compose                  |
| Reverse Proxy| Nginx (load balancer for scaling)       |
| CI/CD        | GitHub Actions (self-hosted runner)     |
| Monitoring   | Uptime Kuma + file-based access logs    |
| Security     | Helmet, rate-limiting, ufw firewall, non-root container |

## 📂 Struktur Proyek

```
todo-app/
├── server.js              # Express app + Todo API
├── db.js                  # SQLite setup
├── test.js                # Smoke test used by CI
├── public/                 # Frontend (HTML/CSS/JS)
├── Dockerfile
├── docker-compose.yml      # app + nginx + uptime-kuma
├── nginx/nginx.conf        # reverse proxy / load balancer config
├── .github/workflows/deploy.yml  # CI/CD pipeline
├── scripts/setup-vm.sh     # one-time VM provisioning script
├── .env.example
└── README.md
```

## ☁️ Arsitektur Deployment

```
GitHub repo (push to main)
        │
        ▼
GitHub Actions
 ├── Job 1: build-and-test   (GitHub-hosted runner)
 └── Job 2: deploy           (self-hosted runner running ON the VM)
        │
        ▼
VMware Ubuntu VM
 ├── nginx (port 80)  ── load balances across N instances of "app"
 ├── app (Node/Express, scalable via `docker compose up --scale app=N`)
 └── uptime-kuma (port 3001) ── monitoring dashboard
```

Karena VM ini **local only** (tidak punya IP publik), pipeline tidak bisa
"masuk" ke VM dari GitHub-hosted runner biasa. Solusinya: sebuah
**self-hosted runner** di-install langsung di VM. Runner ini yang aktif
menghubungi GitHub (outbound), jadi tidak perlu port terbuka ke internet.

## 🚀 Cara Deploy (Setup Sekali di VM)

1. Clone/copy repo ini ke VM Ubuntu kamu:
   ```bash
   git clone <URL_REPO_KAMU> ~/todo-app
   cd ~/todo-app
   ```
2. Jalankan script provisioning (install Docker, ufw, dsb):
   ```bash
   bash scripts/setup-vm.sh
   ```
3. Daftarkan VM sebagai **GitHub Actions self-hosted runner**
   (Settings → Actions → Runners → New self-hosted runner di repo kamu),
   ikuti instruksi yang muncul di layar GitHub.
4. Salin `.env.example` ke `.env` dan isi sesuai kebutuhan:
   ```bash
   cp .env.example .env
   ```
5. Push ke branch `main` — pipeline otomatis build, test, lalu deploy
   di VM via `docker compose up -d --build`.

## 🔧 Menjalankan Secara Manual (tanpa CI/CD)

```bash
docker compose up -d --build
```

Buka `http://<IP_VM>/` untuk aplikasi, dan `http://<IP_VM>:3001` untuk dashboard monitoring.

## 🔐 Keamanan yang Diterapkan

- **Tidak ada secret hardcoded** — semua lewat `.env` (masuk `.gitignore`)
- **Helmet.js** — menambahkan HTTP security headers standar
- **Rate limiting** — membatasi 100 request/menit per IP ke `/api/*`
- **Non-root user di container** — Docker image jalan sebagai user `node`, bukan root
- **Firewall (ufw)** — hanya port 22 (SSH), 80 (app), dan 3001 (monitoring) yang dibuka

## 📈 Monitoring

- **Access log**: setiap request dicatat ke `logs/access.log` (format `combined`, siap untuk dianalisis atau diarahkan ke tool log lain)
- **Health endpoint**: `GET /health` mengembalikan status + uptime, dipakai juga oleh Docker `HEALTHCHECK` dan Nginx
- **Dashboard**: [Uptime Kuma](https://github.com/louislam/uptime-kuma) berjalan di port `3001`, dikonfigurasi untuk memonitor endpoint `/health` aplikasi (uptime, response time, history) — screenshot dashboard disertakan di laporan pengumpulan

## 🚀 Scaling

Scaling manual dengan Docker Compose + Nginx sebagai load balancer:

```bash
docker compose up -d --scale app=3
```

Nginx (`nginx/nginx.conf`) menggunakan Docker's embedded DNS resolver
(`127.0.0.11`) sehingga otomatis mendistribusikan traffic ke seluruh
instance `app` yang sedang berjalan, tanpa perlu restart nginx.

## 🧪 Testing

```bash
npm test
```

Menjalankan smoke test sederhana yang memastikan server bisa start dan
`/health` merespons `200 OK` — dipakai juga di step `build-and-test` pada
pipeline CI/CD.

## 📋 Checklist Tugas

- [x] CI/CD pipeline (build, test, deploy) — `.github/workflows/deploy.yml`
- [x] Deploy ke server (VM Ubuntu via self-hosted runner)
- [x] Security: no hardcoded secrets, rate limiting, non-root container, firewall
- [x] Monitoring: access logs + Uptime Kuma dashboard
- [x] Scaling: docker-compose scale + Nginx load balancing
- [x] Dokumentasi (README ini)
