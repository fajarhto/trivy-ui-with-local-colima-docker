# Platform compatibility and prerequisites

## Read this before installing

This repository is a personal experiment shared for people who want to try it. **No installation help, troubleshooting, technical support, maintenance commitment, or other assistance is provided.** Read the [no-support policy](../SUPPORT.md).

Only the environment listed as tested below has been exercised locally. The project does not have a cross-platform certification or test matrix. The separate fresh-clone build instructions are not a claim that every operating-system/version combination has been tested.

| Platform | Runtime and installation path | Project verification status |
|---|---|---|
| macOS, Apple Silicon | Colima with Docker Engine; Linux ARM64 containers | Tested locally; primary environment |
| macOS, Intel | Colima with Docker Engine; Linux AMD64 containers | Documented but untested; experimental |
| Linux, AMD64 or ARM64 | Local rootful Docker Engine with its Unix socket | Documented but untested; experimental |
| Windows with WSL2 | Ubuntu inside WSL2, Docker Desktop's WSL2 integration, Linux containers | Documented but untested; experimental |
| Native Windows PowerShell/CMD or Windows containers | Native Windows image builds and direct Windows named-pipe access | Not supported |
| Other CPU architectures, rootless Docker, remote Docker daemons, Podman, or other runtimes | No verified installation procedure in this repository | Outside the documented setup; not supported here |

The application runs Linux containers. Its build script uses a POSIX shell, Unix utilities, and a Linux-targeted Go build. Its Compose configuration mounts `/var/run/docker.sock`. These choices explain why the Windows path requires WSL2 and Linux containers.

## Requirements common to all documented paths

- A local Docker engine with permission to inspect images and containers, build images, and start this application's services.
- Docker Compose v2 or later and Docker Buildx.
- Git, curl, tar, `shasum`, CA certificates, and a working POSIX shell.
- Go installed in the environment that runs `scripts/rebuild-scanner.sh`. The script downloads its pinned Go toolchain; internet access and automatic toolchain downloads must be allowed.
- Access to GitHub, Go module services, container registries, Alpine repositories and the Trivy database download service.
- At least 10 GiB free space on the host and adequate space in Docker's filesystem; 15-20 GiB free host space is preferable. Compilation may need more depending on caches and toolchain versions. Check during the build and stop before exhausting storage.
- Enough RAM and CPU for compilation and the Docker engine. A 4-CPU/6-GiB Colima VM is an example allocation, not a minimum or a guarantee; the host also needs resources for the Go build and operating system.
- A local checkout outside cloud-synced directories. On WSL2, use its Linux filesystem, such as `~/src`, rather than a Windows-mounted or OneDrive path.
- Port 3080 available on loopback, or an explicitly chosen alternative loopback port. Preserve existing applications using that port.
- Explicit acceptance of Docker-socket access. It grants broad daemon privileges even though the application containers run as non-root `app`; a read-only mount does not make the Docker API read-only.

The operating-system login name does not need to be `app`. That is the account created **inside** the app images. Configure `DOCKER_GID` from the socket in the selected Docker engine, not from another computer's user/group IDs.

## macOS with Apple Silicon or Intel

### Prerequisites

- A macOS release supported by your installed Homebrew and Colima versions, with hardware virtualization available.
- Homebrew and any developer tools required by Homebrew. Follow [Homebrew's official installation instructions](https://brew.sh/).
- Available host and VM resources as described above.
- On Apple Silicon, prefer a native ARM64 Docker VM. On Intel, use AMD64. Inspect the **Docker daemon** architecture before choosing `TARGETARCH`.

### Installation

1. Inspect existing profiles and contexts before starting or changing a VM:

   ```sh
   colima list
   docker context ls
   ```

   If a tool is not installed yet, install it in the next step. Do not reset or delete existing profiles.

2. Install missing tools through Homebrew:

   ```sh
   brew install colima docker docker-compose docker-buildx go git
   docker compose version
   docker buildx version
   ```

   If plugins are not discovered, read `brew info docker-compose`, `brew info docker-buildx`, and [Colima's installation guide](https://colima.run/docs/installation/). Preserve existing Docker configuration and links.

3. Reuse the intended running Colima Docker profile. For a genuinely new default profile, an example is:

   ```sh
   colima start --runtime docker --cpu 4 --memory 6 --disk 40
   docker context use colima
   docker info
   colima ssh -- df -h
   ```

   Adapt resources to the host. Use the appropriate context and profile arguments for a named profile. Ask before interrupting workloads on an existing VM.

4. Follow [Installation steps 4-7](INSTALLATION.md#4-clone-and-build-the-scanner) to clone, build, configure and verify the app. Choose `TARGETARCH=arm64` for an ARM64/aarch64 daemon, or `TARGETARCH=amd64` for AMD64/x86_64.

Apple Silicon is the only locally tested platform. The Intel procedure follows the architecture-aware build path but has not been verified on an Intel Mac.

## Linux with local Docker Engine

### Prerequisites

- A 64-bit Linux distribution and architecture supported by Docker Engine and the installed Go toolchain. This project's documented targets are Linux AMD64 and ARM64.
- A local **rootful** Docker daemon exposing `/var/run/docker.sock` and authorization for the installing user to use it. Rootless/custom socket setups need additional configuration and are outside this guide.
- Compose v2 or later, Buildx, Go and the common utilities listed above.
- No Colima VM is required when using native Docker Engine on Linux.

### Installation (Ubuntu example)

1. Install common utilities using the distribution's package manager:

   ```sh
   sudo apt-get update
   sudo apt-get install git curl tar perl ca-certificates
   command -v git curl tar shasum
   ```

   These commands are for Ubuntu/Debian-style package managers. Use the appropriate packages for another distribution.

2. Install Docker Engine, CLI, containerd, Buildx and Compose following [Docker's official Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/), or the [official guide for your distribution](https://docs.docker.com/engine/install/). After Docker's official repository has been configured, the Ubuntu package names are:

   ```sh
   sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```

   Do not run that package command before configuring the repository or blindly remove an existing Docker installation. Follow the distro guide and preserve existing data.

3. Install Go using [the official Go installation instructions](https://go.dev/doc/install). Then verify:

   ```sh
   go version
   docker info
   docker compose version
   docker buildx version
   test -S /var/run/docker.sock
   ```

   If Docker access is denied, review [Docker's Linux post-installation instructions](https://docs.docker.com/engine/install/linux-postinstall/). Membership in the Docker group grants root-level daemon privileges; obtain permission before granting it. Do not chmod the socket to 666 or change application runtime users to root.

4. Follow [Installation steps 4-7](INSTALLATION.md#4-clone-and-build-the-scanner). These shared steps do not need Colima commands. Select `TARGETARCH` from `docker info --format '{{.Architecture}}'`, detect the socket group, save `DOCKER_GID` in ignored `.env`, and start Compose.

5. Open `http://localhost:3080` from the machine's browser and complete a scan. Do not expose the unauthenticated app to a network to work around an access problem.

This Linux procedure is documented from the project's Linux image/socket design and official tool instructions. **It has not been tested by this project.** If it fails, no assistance or resolution is promised.

## Windows through WSL2 and Docker Desktop

### Prerequisites

- A Windows version supported by the current Docker Desktop and WSL2 releases, with hardware virtualization enabled and enough memory/storage. Check the current [Docker Desktop Windows system requirements](https://docs.docker.com/desktop/setup/install/windows-install/) rather than assuming every Windows edition or release works.
- WSL2 with an Ubuntu distribution and the current WSL prerequisites required by Docker Desktop.
- Docker Desktop configured for its WSL2 backend and **Linux containers**, with WSL integration enabled for the chosen Ubuntu distribution.
- Git, curl, tar, shasum, CA certificates and Go installed **inside Ubuntu/WSL2**. A Windows-only Go installation is not a substitute for the documented Linux shell workflow.
- Review and accept Docker Desktop's own license terms if applicable. This repository's license does not grant rights to Docker Desktop.

Colima is not used in this Windows procedure. Do not try to run the macOS Homebrew/Colima steps in native PowerShell.

### Installation

1. In PowerShell with the permissions required by Microsoft, install or inspect WSL:

   ```powershell
   wsl --install -d Ubuntu
   wsl --update
   wsl --list --verbose
   ```

   Use [Microsoft's WSL installation guide](https://learn.microsoft.com/windows/wsl/install), complete any requested restart, and finish Ubuntu's initial setup. Confirm the distribution is using WSL **2**. Do not reinstall a distribution that already contains user data.

2. Install and start Docker Desktop using [Docker's official Windows instructions](https://docs.docker.com/desktop/setup/install/windows-install/). In Settings, enable the WSL2 engine and integration for Ubuntu as described in the [Docker WSL2 guide](https://docs.docker.com/desktop/features/wsl/). Use Linux container mode.

3. Open the **Ubuntu/WSL2 terminal**. All remaining installation commands run there, not in PowerShell:

   ```sh
   sudo apt-get update
   sudo apt-get install git curl tar perl ca-certificates
   command -v git curl tar shasum
   docker info
   docker compose version
   docker buildx version
   test -S /var/run/docker.sock
   ```

   Install Go **inside WSL2** using [Go's Linux installation instructions](https://go.dev/doc/install), then run `go version`. Let Docker Desktop's WSL integration provide Docker access; do not install a competing native Docker daemon inside this same WSL distribution for this procedure.

4. Create/use a checkout directory in Ubuntu's Linux home filesystem. Follow [Installation steps 4-7](INSTALLATION.md#4-clone-and-build-the-scanner) in the WSL terminal. The architecture selection is based on the Docker daemon, not the Windows executable architecture. Build the Linux scanner, detect the Docker VM socket group, persist `DOCKER_GID` in `.env`, and start Compose.

5. Try `http://localhost:3080` from the Windows browser. If it is unavailable, inspect WSL integration, local port forwarding, firewall settings, Docker logs and port conflicts. Do not disable security protections or publish the Docker API to solve the problem.

This Windows/WSL2 procedure is **experimental and untested by this project**. Native Windows installation, Windows containers, and direct Windows named-pipe mounting are not supported. No Windows troubleshooting help is provided.

## What “tested” means here

The author exercised the application locally on macOS Apple Silicon with Colima/Docker, including non-root users, local inventory, image scans and report display. This is not a guarantee for other macOS versions, a promise that future dependency updates will work, or evidence of a tested Linux/Windows installation. There is no maintained platform support service. See [SUPPORT.md](../SUPPORT.md).
