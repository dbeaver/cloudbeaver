#!/usr/bin/env bash
BASE_JAVA_TAG="${1:?Usage: $0 <version>}"
cd .. || exit
docker build -t dbeaver/cloudbeaver:dev . --file ./docker/cloudbeaver-ce/Dockerfile --build-arg BASE_JAVA_TAG="$BASE_JAVA_TAG"
