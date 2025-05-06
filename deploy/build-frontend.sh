#!/bin/bash
set -Eeuo pipefail

echo "Build static content"

mkdir -p ./cloudbeaver/web

cd ../../cloudbeaver/common-typescript

yarn install --immutable
cd ../webapp
yarn install --immutable
cd ./packages/product-default
yarn run bundle

if [[ "$?" -ne 0 ]] ; then
  echo 'Application build failed'; exit $rc
fi

cd ../../../common-typescript
yarn test
cd ../webapp
yarn test

if [[ "$?" -ne 0 ]] ; then
  echo 'Frontend tests failed'; exit $rc
fi

cd ../deploy

echo "Copy static content"

cp -rp ../webapp/packages/product-default/lib/* cloudbeaver/web

echo "Cloudbeaver is ready. Run run-server.sh in cloudbeaver folder to start the server."
