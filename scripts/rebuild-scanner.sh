#!/bin/sh
# Build the pinned upstream Trivy source with the three advisory fixes.
set -eu
project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
build_dir="${SCANNER_BUILD_DIR:-$project_dir/.build/scanner}"
mkdir -p "$build_dir/source" "$project_dir/backend/vendor"
curl -fL https://codeload.github.com/aquasecurity/trivy/tar.gz/e713f67f7d54decdcd9b3132c9751833dcced698 -o "$build_dir/source.tar.gz"
printf '%s  %s\n' '5bcd06d8bdae338978b8ef597cb23cd0ff2e710d1ea9097c1143ec6b07d362d6' "$build_dir/source.tar.gz" | shasum -a 256 -c -
tar -xzf "$build_dir/source.tar.gz" -C "$build_dir/source" --strip-components=1
cd "$build_dir/source"
export GOPATH="$build_dir/go" GOMODCACHE="$build_dir/go/pkg/mod" GOCACHE="$build_dir/go/cache" GOENV=off GOTOOLCHAIN=go1.27.3
go get github.com/go-jose/go-jose/v4@v4.1.6 golang.org/x/net@v0.62.0 golang.org/x/crypto@v0.58.1-0.20261009181718-2f1f834330b2
CGO_ENABLED=0 GOOS=linux GOARCH="${TARGETARCH:-arm64}" go build -p 3 -trimpath -ldflags '-s -w -X github.com/aquasecurity/trivy/pkg/version/app.ver=0.76.1-fds.1' -o "$project_dir/backend/vendor/trivy" ./cmd/trivy
