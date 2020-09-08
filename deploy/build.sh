#!/bin/bash
set -e

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
cd ../../../deploy

echo "Copy server packages"

cp -rp ../server/product/web-server/target/products/io.cloudbeaver.product/all/all/all/* ./cloudbeaver/server
cp -p ./scripts/* ./cloudbeaver
cp -rp ../samples/sample-databases/GlobalConfiguration cloudbeaver/workspace
cp -p ../samples/sample-databases/*.conf cloudbeaver/conf/
mv drivers cloudbeaver

echo "Build static content"

cd ../webapp

yarn
lerna run bootstrap
lerna run build --stream --scope=@cloudbeaver/product-default -- -- --mode=production

cd ../deploy

echo "Copy static content"

cp -rp ../webapp/packages/product-default/lib/* cloudbeaver/web

echo "Cloudbeaver is ready. Run run-server.bat in cloudbeaver folder to start the server."
