# Installation with Colima and Docker

For an assistant to do the work, copy the [AI installation prompt](../INSTALL_WITH_AI.md). This guide contains the shared build/configuration steps and the macOS setup path. **Read [platform status, prerequisites and installation paths](PLATFORMS.md) first:** only macOS Apple Silicon has been tested locally. Intel macOS, Linux and Windows/WSL2 paths are experimental and untested; native Windows is not supported. For Linux/WSL2, prepare the platform using that guide, skip macOS-only steps 2-3 below, and continue from step 4.

**No installation help, troubleshooting, technical support or other assistance is provided.** This is a personal experiment shared as is; see [the no-support policy](../SUPPORT.md).

## 1. Check the host

```sh
uname -s
uname -m
df -h .
command -v brew git curl tar shasum go colima docker
```

Use a local, non-cloud-synced checkout directory. The source build downloads Go modules and produces substantial compilation caches. Start with at least 10 GiB free host disk space; 15-20 GiB is preferable. Also check the VM's free space. Do not continue if storage is nearly full.

## 2. Install missing tools

On macOS, use the [official Homebrew installation instructions](https://brew.sh/) if Homebrew is not installed. Install only the tools you need:

```sh
brew install colima docker docker-compose docker-buildx go git
```

Check plugin availability:

```sh
docker compose version
docker buildx version
```

If either plugin is missing, consult `brew info docker-compose`, `brew info docker-buildx` and the [Colima installation documentation](https://colima.run/docs/installation/). Follow the installed formula's plugin discovery instructions. Preserve existing Docker configuration and plugin links. Do not replace the entire `~/.docker/config.json`.

Linux users should follow the [Colima installation documentation](https://colima.run/docs/installation/) or install a local Docker Engine using [Docker's official distribution-specific instructions](https://docs.docker.com/engine/install/), plus the [Compose plugin](https://docs.docker.com/compose/install/linux/). Go, Git, curl, tar and shasum are also required. Native Windows setup is not covered here; do not apply the macOS commands unchanged.

## 3. Start or select Colima

```sh
colima list
docker context ls
```

Reuse the intended running Docker profile. For a new default profile only, an example allocation is:

```sh
colima start --runtime docker --cpu 4 --memory 6 --disk 40
```

Choose resources the host can support. Do not apply these settings to a running profile or restart other applications without permission. If using a named profile, use its corresponding Docker context rather than assuming the default context below.

```sh
docker context use colima
docker context inspect colima
docker info
colima ssh -- df -h
```

The context change affects subsequent Docker commands. Confirm the endpoint is your intended local engine. A 40 GiB virtual disk does not guarantee 40 GiB of available host or VM storage.

## 4. Clone and build the scanner

```sh
git clone https://github.com/fajarhto/trivy-ui-with-local-colima-docker.git
cd trivy-ui-with-local-colima-docker
git rev-parse HEAD
```

Determine the daemon architecture:

```sh
docker info --format '{{.Architecture}}'
```

For an ARM64/aarch64 daemon:

```sh
TARGETARCH=arm64 ./scripts/rebuild-scanner.sh
```

For an AMD64/x86_64 daemon:

```sh
TARGETARCH=amd64 ./scripts/rebuild-scanner.sh
```

The script verifies the upstream archive and generates `backend/vendor/trivy`. It requires a Go installation that can download the pinned toolchain. The resulting `0.76.1-fds.1` scanner is a locally modified Trivy build; see [its build notes](../backend/vendor/README.md). Do not commit the executable or `.build/` cache.

## 5. Configure the Docker socket group

First understand and approve the access: the backend's Docker socket connection provides broad daemon privileges. Non-root execution and a read-only socket mount do **not** restrict the API to read-only operations. This app has no authentication and must remain bound to loopback.

Probe the socket group inside the selected Docker VM:

```sh
export DOCKER_GID="$(docker run --rm --user 65534:65534 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  alpine:3.24.3 stat -c %g /var/run/docker.sock)"
printf 'Docker VM socket group: %s\n' "$DOCKER_GID"
```

Save this numeric value as `DOCKER_GID=<detected-value>` in the repository's ignored `.env` file. If `.env` already exists, update only that key and preserve other settings. Do not copy a group ID from a different computer or overwrite the file blindly. Compose reads `.env` on future runs, so the value survives opening a new terminal.

## 6. Validate and start

Check that port 3080 and the `trivy-ui-frontend`/`trivy-ui-backend` names are available. If another installation owns them, resolve that conflict without deleting its data.

```sh
docker compose -f compose.local.yml config -q
docker compose -f compose.local.yml up -d --build
docker compose -f compose.local.yml ps
docker compose -f compose.local.yml logs --tail=100 backend frontend
```

The default URL is **http://localhost:3080**. For a port conflict, adjust the host port while retaining the `127.0.0.1` binding. Do not publish the backend port or Docker API to the network.

## 7. Verify

```sh
curl --fail http://localhost:3080/
curl --fail http://localhost:3080/api/docker/inventory
docker compose -f compose.local.yml exec -T backend id
docker compose -f compose.local.yml exec -T frontend id
```

Both `id` commands must report `app` with a nonzero UID. The backend should be healthy. In the UI, select **Docker Lokal**, choose an image and click **Scan**. Wait for the job to finish. The first scan can take longer because it downloads the vulnerability database. The same row should show counts, score and timestamp; **Security** should open the report. The **Upload File** tab must remain available.

Counts and scores depend on the image and database date. Do not assume that successful installation implies 100/100. A container scan checks its image, not runtime mounts or filesystem changes.

## Daily use and updates

```sh
# Start existing services.
docker compose -f compose.local.yml up -d

# Stop services while preserving data.
docker compose -f compose.local.yml stop

# Read recent logs.
docker compose -f compose.local.yml logs --tail=100 backend frontend
```

To update, inspect `git status` and preserve local changes before using `git pull --ff-only`. Read any changed build instructions. Rebuild the scanner if its source, dependency patch or target architecture changed, then run `docker compose -f compose.local.yml up -d --build`. Retain `.env` and existing named volumes. Back up important reports before an upgrade; the `reports` volume name can be inspected with `docker volume ls` and `docker volume inspect`.

Never use `docker compose down -v`, `docker volume prune`, or `colima delete` as ordinary maintenance. They can delete persisted data. Do not prune other projects' resources to solve a build issue.

## Troubleshooting

| Symptom | Check and action |
|---|---|
| `DOCKER_GID` is required | Read the VM socket group and persist the numeric value in `.env`. |
| Backend cannot access Docker | Verify the selected context, socket mount and VM group; do not run as root or chmod the socket to 666. |
| `exec format error` | Rebuild the scanner for the Docker daemon architecture. |
| `backend/vendor/trivy` is missing | Complete the scanner build before building the backend image. |
| Dockerfile is missing | Use the current Compose files and `backend/Dockerfile`; do not use a local-only security-patch Dockerfile from an older checkout. |
| Compose or Buildx is unavailable | Check the installed package's plugin discovery instructions; preserve Docker configuration. |
| No space left / input-output errors | Stop the build and check both host and VM storage. Do not delete volumes. Recover space safely before retrying; obtain permission before restarting shared Colima services. |
| Files time out while reading | Check cloud-file hydration and use a fully local checkout. |
| Port or container name is already used | Identify the existing installation; agree on another port/name or an upgrade path. |
| UI cannot reach backend after an update | Check backend health and logs; if healthy, recreate only the app's frontend to refresh its proxy connection. |
| Initial scan appears slow | Check scan status and logs; allow the database download to finish. |

Keep [the license and credit notices](../THIRD_PARTY_NOTICES.md) when copying, modifying or redistributing this project.
