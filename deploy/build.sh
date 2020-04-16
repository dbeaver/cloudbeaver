#!/bin/bash
echo "Clone and build Cloudbeaver"

rm -rf ./cloudbeaver
mkdir ./cloudbeaver
mkdir ./cloudbeaver/server
mkdir ./cloudbeaver/conf
mkdir ./cloudbeaver/workspace
mkdir ./cloudbeaver/web

echo "Build dbeaver application"

cd ../..
if [[ ! -f dbeaver ]]
then
  git clone https://github.com/dbeaver/dbeaver.git
fi
cd dbeaver
git pull
mvn clean install
cd ../cloudbeaver/deploy

echo "Build cloudbeaver server"

cd ../server
mvn clean package
cd ../deploy

echo "Copy server packages"

cp -rp ../server/product/web-server/target/products/io.cloudbeaver.product/all/all/all/* ./cloudbeaver/server
cp -p ./scripts/run-server.sh ./cloudbeaver
mkdir ./cloudbeaver/workspace/GlobalConfiguration
cp -rp ../samples/sample-databases/GlobalConfiguration cloudbeaver/workspace/GlobalConfiguration
cp ../samples/sample-databases/cloudbeaver-sample.conf cloudbeaver/conf/cloudbeaver.conf

echo "Build static content"

cd ../webapp

npm i lerna
npx lerna bootstrap
npx lerna run build --scope @dbeaver/dbeaver -- -- --pluginsList=../../../../products/default/plugins-list.js

cd ../deploy

echo "Copy static content"

cp -rp ../webapp/packages/dbeaver/dist cloudbeaver/web

echo "Cloudbeaver is ready. Run run-server.bat in cloudbeaver folder to start the server."
