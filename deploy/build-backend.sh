#!/bin/bash
set -Eeo pipefail
set +u

# #command line arguments
# CONFIGURATION_PATH=${1-"../config/sample-databases/DefaultConfiguration"}
# SAMPLE_DATABASE_PATH=${2-""}

# echo $CONFIGURATION_PATH
# echo $SAMPLE_DATABASE_PATH
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
[ ! -d dbeaver ] && git clone --depth 1 https://github.com/dbeaver/dbeaver.git
[ ! -d dbeaver-common ] && git clone --depth 1 https://github.com/dbeaver/dbeaver-common.git


cd cloudbeaver/deploy

echo "Build CloudBeaver server"

cd ../server/product/aggregate
mvn clean verify $MAVEN_COMMON_OPTS -Dheadless-platform
if [[ "$?" -ne 0 ]] ; then
  echo 'Could not perform package'; exit $rc
fi
cd ../../../deploy

echo "Copy server packages"

cp -rp ../server/product/web-server/target/products/io.cloudbeaver.product/all/all/all/* ./cloudbeaver/server
cp -p ./scripts/* ./cloudbeaver
mkdir cloudbeaver/samples

if [[ -z $SAMPLE_DATABASE_PATH  ]]; then
  SAMPLE_DATABASE_PATH=""
else
  mkdir cloudbeaver/samples/db
  cp -rp "${SAMPLE_DATABASE_PATH}" cloudbeaver/samples/
fi

cp -rp  ../config/core/* cloudbeaver/conf
cp -rp ../config/sample-databases/DefaultConfiguration/GlobalConfiguration/.dbeaver/data-sources.json cloudbeaver/conf/initial-data-sources.conf
cp -p ../config/sample-databases/DefaultConfiguration/*.conf cloudbeaver/conf/
mv drivers cloudbeaver

echo "End of backend build"