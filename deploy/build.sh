#!/bin/bash
set -Eeuo pipefail

#command line arguments
CONFIGURATION_PATH=${1-"../config/sample-databases/DefaultConfiguration"}
SAMPLE_DATABASE_PATH=${2-""}

echo "Clone and build Cloudbeaver"

rm -rf ./drivers
rm -rf ./cloudbeaver
mkdir ./cloudbeaver
mkdir ./cloudbeaver/server
mkdir ./cloudbeaver/conf
mkdir ./cloudbeaver/workspace
mkdir ./cloudbeaver/web

echo "Clone dbeaver platform"

cd ../..
[ ! -d dbeaver ] && git clone https://github.com/dbeaver/dbeaver.git
cd cloudbeaver/deploy

echo "Build CloudBeaver server"

cd ../server/product/aggregate
mvn clean package -Dheadless-platform
if [[ "$?" -ne 0 ]] ; then
  echo 'Could not perform package'; exit $rc
fi
cd ../../../deploy

echo "Copy server packages"

cp -rp ../server/product/web-server/target/products/io.cloudbeaver.product/all/all/all/* ./cloudbeaver/server
cp -p ./scripts/* ./cloudbeaver
mkdir cloudbeaver/samples

if [[ ! -z "${SAMPLE_DATABASE_PATH}"  ]]; then
  mkdir cloudbeaver/samples/db
  cp -rp "${SAMPLE_DATABASE_PATH}" cloudbeaver/samples/
fi

cp -rp  ../config/core/* cloudbeaver/conf
cp -rp "${CONFIGURATION_PATH}"/GlobalConfiguration/.dbeaver/data-sources.json cloudbeaver/conf/initial-data-sources.conf
cp -p "${CONFIGURATION_PATH}"/*.conf cloudbeaver/conf/
mv drivers cloudbeaver

echo "Build static content"

cd ../webapp

yarn
lerna run bootstrap
lerna run build --no-bail --stream --scope=@cloudbeaver/product-default #-- -- --env source-map
if [[ "$?" -ne 0 ]] ; then
  echo 'Application build failed'; exit $rc
fi

cd ../deploy

echo "Copy static content"

cp -rp ../webapp/packages/product-default/lib/* cloudbeaver/web

echo "Cloudbeaver is ready. Run run-server.bat in cloudbeaver folder to start the server."
