#!/usr/bin/env sh

script_dir="$(realpath "$(dirname "$0")")"
dbeaver_common_dir="$(realpath "$script_dir"/../../../dbeaver-common)"
version=$("$dbeaver_common_dir/mvnw" -f "$dbeaver_common_dir/root" help:evaluate -Dexpression=dbeaver-version -q -DforceStdout)
cd ..
docker build -t dbeaver/cloudbeaver:dev . --file ./docker/cloudbeaver-ce/Dockerfile --build-arg BASE_JAVA_TAG="${version}"
