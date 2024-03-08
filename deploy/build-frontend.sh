#!/bin/bash
set -Eeuo pipefail

echo "Build static content"

cd ../../cloudbeaver/webapp

yarn
yarn lerna run bootstrap
yarn lerna run bundle --no-bail --stream --scope=@cloudbeaver/product-default #-- -- --env source-map
if [[ "$?" -ne 0 ]] ; then
  echo 'Application build failed'; exit $rc
fi

cd ../deploy

echo "Copy static content"

cp -rp ../webapp/packages/product-default/lib/* cloudbeaver/web

echo "Cloudbeaver is ready. Run run-server.sh in cloudbeaver folder to start the server."
