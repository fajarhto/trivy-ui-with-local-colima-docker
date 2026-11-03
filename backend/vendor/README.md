# Locally built scanner

Run `./scripts/rebuild-scanner.sh` to create `backend/vendor/trivy` (ignored by Git).
Base: Aqua Security Trivy v0.76.1, commit e713f67f7d54decdcd9b3132c9751833dcced698.
Local version: 0.76.1-fds.1, compiled with Go 1.27.3.
Dependency changes are recorded in trivy-dependencies.patch.
The upstream source archive SHA-256 is checked by the build script.
No scanner executable is distributed in this source repository.
See ../../THIRD_PARTY_NOTICES.md and ../../LICENSES/ for attribution.
