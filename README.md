# Trivy UI with Local Colima Docker

A personal, independent adaptation of [Trivy UI by geek-kb / Itai Ganot](https://github.com/geek-kb/trivy-ui), with local Docker/Colima inventory, scanning, inline results, and an L1 security breakdown adapted from [ColimaUI](https://github.com/vnknowledge2014/colima-ui).

This is a community modification for personal use. It is not an official product of Aqua Security, Trivy, Colima, Docker, or ColimaUI, and is not endorsed by those projects. Their names identify compatible tools and credited upstream work.

## Compatibility and no-support policy

**Tested locally only on macOS Apple Silicon with Colima and Docker.** macOS Intel, Linux with local Docker Engine, and Windows through WSL2/Docker Desktop have documented but **untested, experimental** installation paths. Native Windows/PowerShell installation and Windows containers are **not supported**.

See **[platform-specific prerequisites and installation instructions](docs/PLATFORMS.md)** before trying to install. A documented path is not a guarantee of compatibility.

**This is a personal project shared only for people who want to experiment. No installation help, troubleshooting, technical support, maintenance commitment, or other assistance is provided. No response or fix is promised.** Read the **[no-support policy](SUPPORT.md)**. Use the project at your own discretion and keep backups.

## Install with an AI assistant

**[Copy the English build and installation prompt](INSTALL_WITH_AI.md)** into Codex or another local coding assistant. It covers Colima and Docker setup, architecture detection, scanner compilation, safe configuration, troubleshooting, and a complete verification scan.

Start with **[your platform’s prerequisites and installation path](docs/PLATFORMS.md)**, then use the shared **[build and installation steps](docs/INSTALLATION.md)**. Both documents preserve existing data and require non-root runtime users.

## Features

- List local images and all containers, including stopped containers.
- Scan an image or the immutable image ID used by a container.
- Keep Critical / High / Medium / Low counts, last scan time and score in the same table row.
- Review L1 vulnerabilities, hardening, provenance and freshness components.
- Upload existing Trivy JSON reports and keep reports in a persistent Docker volume.
- Run frontend and backend as the non-root user `fajarhartanto`.

A container scan examines its underlying image. It does not inspect runtime filesystem changes, mounted volumes, or runtime container permissions. Scoring is a local Python port of ColimaUI's L1 algorithm and rule pack 1.0.0, not a ColimaUI API connection or certification. Results depend on the exact image, scanner build and vulnerability database date. A score of 100 does not establish that an image is free of all security risks.

## Run locally

Requirements: Docker Engine with Compose v2 (Colima is supported), Go with automatic toolchain downloads enabled, curl, tar, and several GB of free build space. Source compilation can require substantial additional free disk space; reserve at least 10 GB. Published source does not contain prebuilt scanner binaries or application reports.

```sh
# Clone this repository and enter it first.
./scripts/rebuild-scanner.sh
export DOCKER_GID="$(docker run --rm --user 65534:65534 -v /var/run/docker.sock:/var/run/docker.sock:ro alpine:3.24.3 stat -c %g /var/run/docker.sock)"
docker compose -f compose.local.yml up -d --build
```

Open http://localhost:3080. The initial scan downloads the Trivy vulnerability database. The Docker daemon must be running. `TARGETARCH=amd64 ./scripts/rebuild-scanner.sh` builds a Linux AMD64 scanner; the default is ARM64 for Apple Silicon. The scanner version is `0.76.1-fds.1`, a local patched build of upstream Trivy v0.76.1, not an official Aqua release. Source commit, fixes and patch are documented in `backend/vendor/README.md`.

### Docker access

The backend connects to the local Docker socket. Socket access gives the backend broad Docker-daemon privileges even though its Linux user is non-root and the mount is marked read-only. Read-only mounting does not make the Docker API read-only. The app's endpoints provide inventory and scan actions, not container administration. Keep the published port bound to `127.0.0.1`; do not expose this unauthenticated app to an untrusted network. Uploaded reports may contain sensitive package and image information.

`DOCKER_GID` is the socket group ID inside the Docker VM, not necessarily the host macOS group ID. Configure it when installing on a different host. Scan jobs are serialized and their progress is held in memory; restarting the backend clears in-progress job status. Completed reports persist.

Stop services without deleting data:

```sh
docker compose -f compose.local.yml stop
```

The `reports` and `trivy-cache` volumes are retained. Do not use `down -v` unless you intend to delete those volumes.

## Development

```sh
cd frontend
npm ci
npm run build
cd ..
PYTHONPATH=backend python3 -m unittest backend/tests/test_security_summary.py
```

The frontend build validates TypeScript. API routes remain under `/api`; local Docker endpoints are under `/api/docker`. Keep reports and local `.env` files out of Git. Refresh dependency notices when updating packages.

## Credits and licenses

- **Trivy UI** — Copyright (c) 2023 geek-kb; author credited upstream as Itai Ganot. MIT. This repository preserves its source history and original copyright.
- **ColimaUI** — Copyright (c) 2026 vnknowledge2014. MIT. Its rule pack and the L1 scoring/evaluation logic are adapted here; this repository does not redistribute the full ColimaUI app.
- **Trivy** — Aqua Security and contributors. Apache-2.0. Its source is downloaded by the build script; dependency fixes are documented as local changes.
- **Local modifications** — Fajar Hartanto, 2026. MIT, subject to retained third-party notices.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), [NOTICE](NOTICE), [LICENSE](LICENSE), and [LICENSES/](LICENSES/). Dependencies keep their own licenses. Personal use does not waive license conditions when redistributing source, binaries or container images.

## Project logo

<img src="frontend/public/logo.svg" width="56" alt="Three-color shield with a knight sword entering the center of the blue surface" />

The original project logo and its derived favicon files are dedicated under **CC0 1.0 Universal**, to the extent of the contributor's rights. The application code retains its own MIT license and third-party notices. See [the logo dedication](LICENSES/Project-logo-CC0-1.0.txt) and [the attribution record](THIRD_PARTY_NOTICES.md#original-project-logo).
