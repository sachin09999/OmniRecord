# OmniRecord - Cupola 360° Patrol & Recording Center

OmniRecord is a clean, modern, and professional recording dashboard for Cupola 360° panoramic feeds and IP surveillance streams.

---

## Features
- **Clean Enterprise VMS Dashboard**: Simple, uncluttered dark theme (`#0B0F19`, slate gray, subtle blue accents).
- **360° VR WebGL Viewer**: Three.js panorama player with mouse drag look, FOV zoom, auto-rotation, and 3D spatial hotspot nodes.
- **Interactive 2D Floorplan Minimap**: Blueprint floorplan radar cone that tracks camera orientation in real time.
- **No Stream Placeholders**: Displays clean offline placeholder frames when live streams are disconnected.
- **Docker Production Ready**: Multi-stage Dockerfile and Nginx SPA containerization.
- **Automated CI/CD**: GitHub Actions workflow auto-builds and deploys to your remote server on every push to `main`.

---

## Quick Start (Docker)

To launch locally using Docker Compose:
```bash
docker compose up -d
```
Access in your browser at:
`http://localhost:8877/`

---

## Automated Deployment via GitHub Actions

Every push to the `main` branch automatically triggers the `.github/workflows/deploy.yml` workflow:

1. **Build Verification**: Runs Node 20 `npm run build` to ensure zero compilation or type errors.
2. **Remote SSH Deployment**: Connects to your remote server, pulls the latest `main` commit, and rebuilds the Docker container via `docker compose up -d --build`.

### Required GitHub Repository Secrets

Configure the following secrets under **Settings > Secrets and variables > Actions**:

| Secret Name | Description | Example |
| :--- | :--- | :--- |
| `REMOTE_HOST` | Remote server IP or domain | `10.10.12.50` or `my-server.com` |
| `REMOTE_USER` | SSH username on remote PC | `ubuntu` or `dts-sachin` |
| `REMOTE_SSH_KEY` | Private SSH Key for authentication | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `REMOTE_TARGET` | Target directory on remote PC | `~/OmniRecord` |
| `REMOTE_PORT` | *(Optional)* SSH port (default: 22) | `22` |
