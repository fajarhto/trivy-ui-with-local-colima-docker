# Build and install with Codex or another AI assistant

Copy the prompt below into a coding assistant that can read files and run commands on the computer where you want to install the application. This works with Codex or another assistant with equivalent local tools. A text-only chatbot can explain the steps but cannot perform the installation for you.

**Only macOS Apple Silicon with Colima/Docker has been tested locally.** Intel macOS, Linux, and Windows via WSL2/Docker Desktop have documented but untested experimental paths. Native Windows installation and Windows containers are not supported. Read [platform prerequisites and instructions](docs/PLATFORMS.md) first.

**No installation help, troubleshooting, technical support or other assistance is provided by the project.** It is shared as is for people who want to experiment. An AI prompt is self-service documentation, not a support service or a guarantee that installation will work. See [SUPPORT.md](SUPPORT.md).

If you prefer to run commands yourself, see the [installation guide](docs/INSTALLATION.md).

## Copy-and-paste installation prompt

```text
Build and install "Trivy UI with Local Colima Docker" on this computer.

Repository:
https://github.com/fajarhto/trivy-ui-with-local-colima-docker

Perform the installation and verification using your local tools. Do not stop
at providing instructions if you can carry out the work. Communicate in English.
Respect your tool permissions and ask for access when the environment requires it.

1. Inspect the computer before making changes.
   - Identify the operating system, CPU architecture, available RAM, free host
     disk space, and the intended installation directory.
   - Check Git, curl, tar, shasum, Go, Colima, Docker CLI, Compose v2 or later,
     and Buildx. Do not reinstall working tools unnecessarily.
   - Inspect existing Colima profiles and Docker contexts. Use the intended local
     Colima Docker engine; do not accidentally build against a remote daemon.
   - Read the repository README.md, docs/INSTALLATION.md, compose.local.yml,
     docs/PLATFORMS.md, SUPPORT.md, backend/Dockerfile, frontend/Dockerfile,
     and scripts/rebuild-scanner.sh.
   - Explain the tested/experimental status of this host platform. Do not claim
     Linux, Intel macOS or Windows/WSL2 has been tested by the author. The project
     provides no support or assistance; this session is the user's own experiment.
     Treat the checked-out files as the source of truth if this prompt ages.
   - Use a local directory with enough space, preferably outside cloud-synced
     folders. Do not overwrite an existing checkout or discard uncommitted work.

2. Preserve the existing environment and data.
   - Never delete existing images, containers, volumes, reports, databases,
     Colima profiles, or Docker configuration without explicit permission.
   - Do not run system prune, volume prune, down -v, or colima delete as a shortcut.
   - Do not reset/restart a working Colima profile that runs other applications
     without explaining the interruption and obtaining permission.
   - Check for existing trivy-ui-frontend/trivy-ui-backend container names and
     the trivy-ui Compose project. Ask before replacing another installation.
   - Do not overwrite Docker config.json, credentials, or existing plugin links.

3. Prepare Colima and Docker.
   - On macOS with Homebrew, install only missing prerequisites. The usual
     packages are colima, docker, docker-compose, docker-buildx, go, and git.
   - If Homebrew is absent, explain the official installation method and obtain
     any permission needed before installing it. Do not request account secrets.
   - Ensure `docker compose version` and `docker buildx version` work. If plugin
     discovery fails, consult the installed Homebrew formula caveats and official
     Colima/Docker docs; add missing plugin links without replacing existing ones.
   - Reuse a suitable running local Colima Docker profile. For a genuinely new
     profile, consider 4 CPUs, 6 GiB memory and a 40 GiB virtual disk, adjusted
     to the host's capacity. Disk allocation is not proof of free disk space.
   - On Linux, inspect the installed distribution and local Docker setup first.
     Use the official distro-specific Docker/Compose installation instructions,
     or official Colima instructions if Colima is specifically desired. Do not
     apply macOS-specific package paths on Linux. Explain any unsupported platform.
   - On Windows, use only the documented experimental WSL2/Ubuntu + Docker Desktop
     Linux-container path in docs/PLATFORMS.md. Explain its prerequisites before
     making changes. Run the project shell scripts and install Go inside WSL2,
     use the WSL Linux filesystem, and do not add a competing Docker daemon to a
     Docker Desktop-integrated WSL distribution. Native Windows/PowerShell builds,
     Windows containers and direct named-pipe mounting are unsupported. Respect
     any required administrator actions, terms acceptance and restart handoffs.
   - Verify the selected context with `docker context show`, `docker context
     inspect`, and `docker info` before proceeding.

4. Check build capacity and clone the source.
   - Reserve at least 10 GiB free host space; 15-20 GiB is preferable for the full
     Trivy build. Also check space inside the Colima VM. If space is insufficient,
     report it and pause the build rather than filling the disk.
   - Clone the repository into the agreed directory, or reuse a clean existing
     checkout. Record the checked-out commit. Do not force-pull over local changes.
   - Determine the Docker daemon architecture, not only the host architecture.
     Use TARGETARCH=arm64 for an aarch64/arm64 daemon and TARGETARCH=amd64 for an
     x86_64/amd64 daemon. Stop on an unsupported architecture.

5. Build the scanner from source.
   - Run `TARGETARCH=<detected-architecture> ./scripts/rebuild-scanner.sh`.
   - The script verifies a pinned upstream archive and creates backend/vendor/trivy.
     It downloads a pinned Go toolchain and patches the documented dependencies.
     The generated executable is intentionally absent from Git.
   - Do not remove checksum verification, change dependencies arbitrarily, use an
     unverified binary, or suppress vulnerability findings just to obtain a score.
   - Monitor free disk space while building. If permissions or cloud-file
     hydration fail, diagnose that issue instead of changing container users to root.

6. Configure Docker access and persistent settings.
   - Explain that Docker-socket access gives the backend broad Docker-daemon
     privileges even though it runs as a non-root user. A read-only socket mount
     does not make the Docker API read-only. Obtain explicit approval for this
     access before first activation if the user has not already authorized it.
   - Detect the group ID of /var/run/docker.sock inside the selected Docker VM,
     using the documented read-only mount/stat probe. Do not use the macOS host
     socket group as a substitute. Set DOCKER_GID to the detected numeric value.
   - Save DOCKER_GID in the checkout's ignored .env file, preserving any existing
     settings. Do not commit .env or any credentials. Avoid duplicate DOCKER_GID keys.
   - Keep the frontend bound to 127.0.0.1. The default URL is http://localhost:3080.
     If 3080 is occupied by another application, use an agreed free loopback port
     and record the override rather than stopping that application.
   - Keep both runtime image defaults and containers as user fajarhartanto with
     a nonzero UID. Root is permitted only for necessary image build steps.
     Do not chmod the Docker socket to 666, enable privileged mode, or change
     runtime users to root. Preserve the reports and trivy-cache named volumes.

7. Build and start the application.
   - Confirm compose.local.yml references Dockerfiles that exist in this checkout.
   - Validate with `docker compose -f compose.local.yml config -q`.
   - Run `docker compose -f compose.local.yml up -d --build`.
   - Do not rebuild the scanner repeatedly if the verified executable already
     matches this source, dependency patch and target architecture.

8. Verify the installation end to end.
   - Check Compose status and recent logs. The backend must become healthy.
   - Confirm the frontend URL returns HTTP 200 and displays the exact title
     "Trivy UI with Local Colima Docker" and the upstream credit links.
   - Confirm `docker compose -f compose.local.yml exec -T backend id` and the
     equivalent frontend command show user fajarhartanto with a nonzero UID.
   - Check /api/docker/inventory returns images and containers from the selected
     Docker engine. The application must include stopped containers when present.
   - Run a scan of one selected local image from Docker Lokal. Wait for completion,
     including the first vulnerability database download; do not equate "queued"
     with success. Check that counts, timestamp and score appear in the same row
     and that Security opens the detail report.
   - Confirm Upload File remains available. Do not create fake scan results or
     claim a guaranteed 100/100; report the actual scanner/database-based outcome.
   - Verify completed reports remain after a routine app restart if it is safe
     to do so. Do not delete volumes to test persistence.
   - If changing application source, validate TypeScript and run relevant tests.

9. Finish with an English installation report.
   Include the installed commit, selected Colima profile/Docker context, target
   architecture, URL, Compose file location, container users, health status, actual
   test scan result, persistent volume names, and any unresolved issue.
   Provide exact commands to start, stop, view logs, scan again, and update the app.
   Distinguish checks actually performed from checks that could not be completed.
   Do not claim success until the application and a complete scan have been verified.
   Preserve LICENSE, NOTICE, THIRD_PARTY_NOTICES.md, SUPPORT.md and all upstream
   credits. Do not promise author-provided help or guaranteed platform compatibility.
```

## Short prompt after cloning

If the assistant can already access the checkout, use:

```text
Read INSTALL_WITH_AI.md and docs/INSTALLATION.md in this checkout, then carry out
the installation prompt in INSTALL_WITH_AI.md for this computer. Inspect the
existing Colima/Docker environment first, preserve all data, keep runtime users
as fajarhartanto (non-root), and verify the UI and a completed image scan.
Use English and report the actual results and unresolved issues.
```
