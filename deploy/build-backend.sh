#!/bin/bash
set -Eeo pipefail
set +u

script_dir="$(realpath "$(dirname "$0")")"
repositories_root_dir="$(realpath "$script_dir/../..")"

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
[ ! -d "$repositories_root_dir/dbeaver-common" ] && git clone --depth 1 https://github.com/dbeaver/dbeaver-common.git "$repositories_root_dir/dbeaver-common"
source "$repositories_root_dir/dbeaver-common/scripts/git_utils.sh"
prepare_repo_and_dependencies "$repositories_root_dir" cloudbeaver

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

cp -rp  ../config/core/* cloudbeaver/conf
cp -rp ../config/GlobalConfiguration/.dbeaver/data-sources.json cloudbeaver/conf/initial-data-sources.conf
mv drivers cloudbeaver

echo "End of backend build"
