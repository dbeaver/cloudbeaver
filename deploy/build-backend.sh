#!/bin/bash
set -Eeo pipefail
set +u

echo "Clone and build Cloudbeaver"

rm -rf ./drivers
rm -rf ./cloudbeaver
mkdir ./cloudbeaver
mkdir ./cloudbeaver/server
mkdir ./cloudbeaver/conf
mkdir ./cloudbeaver/workspace

echo "Pull cloudbeaver platform"

cd ../..

echo "Pull dbeaver platform"
# Optional: pin platform repos to a release tag/branch (e.g. DBEAVER_GIT_REF=25.1.5).
# When unset, clones the default branch (devel). See deploy/README.md.
DBEAVER_GIT_REF="${DBEAVER_GIT_REF:-}"
DBEAVER_COMMON_GIT_REF="${DBEAVER_COMMON_GIT_REF:-${DBEAVER_GIT_REF}}"
if [ ! -d dbeaver ]; then
  if [ -n "${DBEAVER_GIT_REF}" ]; then
    git clone --depth 1 --branch "${DBEAVER_GIT_REF}" https://github.com/dbeaver/dbeaver.git
  else
    git clone --depth 1 https://github.com/dbeaver/dbeaver.git
  fi
fi
if [ ! -d dbeaver-common ]; then
  if [ -n "${DBEAVER_COMMON_GIT_REF}" ]; then
    git clone --depth 1 --branch "${DBEAVER_COMMON_GIT_REF}" https://github.com/dbeaver/dbeaver-common.git
  else
    git clone --depth 1 https://github.com/dbeaver/dbeaver-common.git
  fi
fi


cd cloudbeaver/deploy

echo "Build CloudBeaver server"

cd ../server/product/aggregate
mvn clean verify $MAVEN_COMMON_OPTS -Dheadless-platform
if [[ "$?" -ne 0 ]] ; then
  echo 'Could not perform package'; exit $rc
fi
cd ../../../deploy

echo "Generate cloudbeaver.conf file"
mvn -f ../apps/config-generator compile exec:java -Dconfig.output="cloudbeaver/conf/cloudbeaver.conf"

echo "Copy server packages"

cp -rp ../server/product/web-server/target/products/io.cloudbeaver.product/all/all/all/* ./cloudbeaver/server
cp -p ./scripts/* ./cloudbeaver
mkdir cloudbeaver/samples

cp -rp  ../config/core/* cloudbeaver/conf
cp -rp ../config/GlobalConfiguration/.dbeaver/data-sources.json cloudbeaver/conf/initial-data-sources.conf
mv drivers cloudbeaver

echo "End of backend build"