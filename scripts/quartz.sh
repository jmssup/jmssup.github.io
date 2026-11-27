#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

version=5.2.2
root="$PWD"
engine="$root/.cache/quartz-v$version"

if [[ ! -f "$engine/package-lock.json" ]]; then
  mkdir -p "$root/.cache"
  download=$(mktemp -d "$root/.cache/quartz-download.XXXXXX")
  trap 'rm -rf "$download"' EXIT
  curl -fsSL --retry 2 "https://codeload.github.com/jackyzha0/quartz/tar.gz/refs/tags/v$version" -o "$download/quartz.tgz"
  (cd "$download" && echo '78fd7128a65c3d4f4b4435a194f08f1002b967c0469ce0f4e32033d5edc2d567  quartz.tgz' | shasum -a 256 -c -)
  mkdir "$download/engine"
  tar -xzf "$download/quartz.tgz" --strip-components=1 -C "$download/engine"
  mv "$download/engine" "$engine"
fi

if [[ ! -f "$engine/.dependencies-ready" ]]; then
  npm --prefix "$engine" ci --no-audit --no-fund
  touch "$engine/.dependencies-ready"
fi

case "${1:-}" in
  export)
    shift
    node scripts/export-blog.mjs "$engine" "${1:-$HOME/Vault/Knowledge}"
    ;;
  build)
    test -f "$root/content/index.md"
    cp quartz.config.yaml "$engine/quartz.config.yaml"
    (cd "$engine" && node quartz/bootstrap-cli.mjs build -d "$root/content" -o "$root/_site")
    test -f "$root/_site/index.html"
    node scripts/legacy-routes.mjs
    ;;
  preview)
    test -f "$root/_site/static/contentIndex.json"
    node -e '
      const serve = require(process.argv[1])
      require("node:http").createServer((request, response) => {
        serve(request, response, { public: "_site", directoryListing: false })
      }).listen(8080, "127.0.0.1", () => console.log("http://127.0.0.1:8080/"))
    ' "$engine/node_modules/serve-handler"
    ;;
  *)
    echo "Usage: bash scripts/quartz.sh {export [vault-path]|build|preview}" >&2
    exit 2
    ;;
esac
