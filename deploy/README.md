# Building CloudBeaver from source

For a full walkthrough see the [Build and deploy](https://github.com/dbeaver/cloudbeaver/wiki/Build-and-deploy) wiki page.
This file documents prerequisite versions that commonly break source builds (see [#3839](https://github.com/dbeaver/cloudbeaver/issues/3839)).

## Prerequisites

| Tool | Required version |
|------|------------------|
| Java | 21 |
| Apache Maven | **3.9.9+** (Tycho 5; **3.9.16+** recommended) |
| Node.js | 20.19.1+ (LTS 22.x recommended) |
| Yarn | **4.x** (see `webapp/package.json` `packageManager`) |

`./build.sh` runs `check-prerequisites.sh` and fails early if these tools are missing or too old.

### Ubuntu / Debian

Do **not** install Maven or Yarn from `apt` for this project. Distro packages are often Maven &lt; 3.9.9 and Yarn 1.x, which fail the CloudBeaver build.

```bash
# Node.js 22.x
curl -sL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get update
sudo apt-get install -y openjdk-21-jdk nodejs curl ca-certificates unzip

# Apache Maven 3.9.x (example: 3.9.11)
curl -fsSL https://dlcdn.apache.org/maven/maven-3/3.9.11/binaries/apache-maven-3.9.11-bin.tar.gz \
  | sudo tar -xzC /opt
export PATH="/opt/apache-maven-3.9.11/bin:${PATH}"

# Yarn 4 via Corepack (matches webapp packageManager)
sudo corepack enable
corepack prepare yarn@4.14.1 --activate

java -version
mvn -v
node -v
yarn -v
```

### Windows

- Install [Java 21](https://adoptium.net/).
- Download [Maven 3.9.9+](https://maven.apache.org/download.cgi) and add its `bin` directory to `PATH`.
- Install [Node.js LTS 22](https://nodejs.org/), then enable Yarn 4 with Corepack:
  `corepack enable` and `corepack prepare yarn@4.14.1 --activate`.

## Build

From a clone of this repository (and sibling checkouts of `dbeaver` / `dbeaver-common` as created by the script):

```bash
cd deploy
./build.sh
```

Artifacts are written to `deploy/cloudbeaver`.

### Matching DBeaver platform versions

`build-backend.sh` clones `dbeaver` and `dbeaver-common` from their default branches when those directories are missing.
To build against a specific release (for example a CloudBeaver tag that must match DBeaver tags), set:

```bash
export DBEAVER_GIT_REF=25.1.5
export DBEAVER_COMMON_GIT_REF=25.1.5
cd deploy
./build.sh
```

If you only need to run CloudBeaver, prefer the official [Docker image](https://hub.docker.com/r/dbeaver/cloudbeaver/tags) or the Dockerfiles under `deploy/docker/` instead of a from-source build.
