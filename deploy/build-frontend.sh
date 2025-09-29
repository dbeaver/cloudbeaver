#!/bin/bash
set -Eeuo pipefail

echo "Build static content"

mkdir -p ./cloudbeaver/web

cd ../../cloudbeaver/webapp

yarn install --immutable
cd ./packages/product-default
yarn run bundle

if [[ "$?" -ne 0 ]] ; then
  echo 'Application build failed'; exit $rc
fi

cd ../../
yarn test

if [[ "$?" -ne 0 ]] ; then
  echo 'Frontend tests failed'; exit $rc
fi

cd ../deploy

echo "Copy static content"

cp -rp ../webapp/packages/product-default/lib/* cloudbeaver/web

echo "Cloudbeaver is ready. Run run-cloudbeaver-server.sh in cloudbeaver folder to start the server."
