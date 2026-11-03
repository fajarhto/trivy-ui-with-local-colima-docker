# Third-party notices and modification record

This source distribution retains the notices below. Each third-party component remains under its original license. The repository's MIT license applies to local changes and does not relicense third-party components. Dependencies installed or built separately are not vendored into this source repository.

## Trivy UI

- Source: https://github.com/geek-kb/trivy-ui
- Based on commit: bbef4682f9dfd75b27f36ed313a4070e2e5a6cf6
- Original notice: Copyright (c) 2023 geek-kb.
- Upstream author credit: Itai Ganot.
- License: MIT; full original text: LICENSES/Trivy-UI-MIT.txt.
- Changes: Docker inventory/scanning API, table with per-image results, local scanner build, non-root Alpine configuration, title and attribution UI, and security report detail additions. Existing upload/report features are retained.

## ColimaUI

- Source: https://github.com/vnknowledge2014/colima-ui
- Local reference revision: 7b11f6a3fbe959758b855575f7ba449a993499e2 (local source snapshot used during adaptation).
- Original notice: Copyright (c) 2026 vnknowledge2014.
- License: MIT; full license and original NOTICE: LICENSES/ColimaUI-MIT.txt and LICENSES/ColimaUI-NOTICE.txt.
- Adapted files: `src-tauri/resources/rules/v1.json` → `backend/app/api/colima_rules.json`; L1 portions of `security_rules.rs` and `security_score.rs` → `backend/app/api/security_summary.py`. Presentation concepts from Security (component breakdown and passing/failing rules) were independently implemented in React.
- Scope: rule-pack text, L1 rule evaluation and the logarithmic vulnerability scoring curve. L2/L3 evaluation, runtime container policy and other ColimaUI functions are not implemented here. This is a port, not a live connection to the ColimaUI application.

ColimaUI's original rule descriptions reference CIS Docker Benchmark section identifiers. CIS text is not included here. CIS Benchmarks is a trademark of the Center for Internet Security. This project is not certified by, affiliated with or endorsed by CIS. See the retained upstream NOTICE for the provenance of these references.

## Trivy

- Source: https://github.com/aquasecurity/trivy
- Base release: v0.76.1, source commit e713f67f7d54decdcd9b3132c9751833dcced698.
- License: Apache License 2.0; full license and upstream NOTICE: LICENSES/Trivy-Apache-2.0.txt and LICENSES/Trivy-NOTICE.txt.
- Copyright 2019-2020 Aqua Security Software Ltd. This product includes software developed by Aqua Security (https://aquasec.com).
- Local changes: dependency updates documented in `backend/vendor/trivy-dependencies.patch`; version label `0.76.1-fds.1`; compiler Go 1.27.3. No official upstream security guarantee is implied. The scanner executable is generated locally and excluded from Git.
- Additional patched Go module projects: go-jose (Apache-2.0), golang.org/x/crypto and golang.org/x/net (BSD-3-Clause). Their source and own notices are obtained through Go modules during compilation. Upstream Trivy also depends on other separately licensed modules; generate and retain their license texts before redistributing a compiled scanner or image.

## Application and build dependencies

Frontend and Python dependency inventories and the license texts found in installed packages are under `LICENSES/dependencies/`. They are a snapshot of the versions used to prepare this repository, not a substitute for checking changes when dependencies are upgraded. Unknown or absent metadata is recorded as such rather than treated as a license grant.

The app uses React, React DOM, React Router, React Hot Toast, Recharts, Vite, TypeScript, Tailwind CSS, FastAPI, Uvicorn, Pydantic, SQLAlchemy, and other dependencies listed in their manifests/lockfile. Copyrights and license terms remain with their respective authors.

## External tools and base images

- Colima: https://github.com/abiosoft/colima — MIT. Docker VM runtime; not redistributed as app source.
- Lima: https://github.com/lima-vm/lima — Apache-2.0. Used by Colima; not redistributed here.
- Docker CLI / Moby: https://github.com/docker/cli and https://github.com/moby/moby — Apache-2.0. Installed in the backend image at build time.
- Alpine Linux: https://alpinelinux.org — individual packages have individual licenses, including permissive and copyleft licenses. Alpine is not licensed under a single blanket MIT license. Images are built locally; package notices/source obligations must be retained when redistributing those images.
- nginx: https://nginx.org — BSD-2-Clause. Installed in the frontend image at build time.
- Python: https://www.python.org — Python Software Foundation license and included notices.
- Node.js and Go: build toolchains with their own bundled dependency notices; not included as source in this repository.

No Docker, Colima, Aqua or CIS logos are used to imply endorsement. Project and product names are used for identification. This repository is published as source for personal/community use; no prebuilt container images or scanner binaries are published by this change.

## Original project logo

The three-color shield with the knight sword inserted into the center of the blue surface is an original geometric project design prepared with AI-assisted drawing tools and approved by Fajar Hartanto in 2026. To the extent Fajar Hartanto holds copyright or related rights in this design, those rights are dedicated under **CC0 1.0 Universal**. See `LICENSES/Project-logo-CC0-1.0.txt`.

This dedication covers `frontend/public/logo.svg`, `logo.png`, `icon.png`, and the favicon files derived from this logo. It does not relicense application code, third-party components, upstream logos, product names or trademarks. No representation of exclusivity, trademark clearance or absence of third-party rights is made.
