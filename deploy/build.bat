echo "Clone and build Cloudbeaver"

IF EXIST cloudbeaver rmdir /S /Q cloudbeaver
mkdir cloudbeaver\server
mkdir cloudbeaver\conf
mkdir cloudbeaver\workspace
mkdir cloudbeaver\web

IF EXIST build rmdir /S /Q build
mkdir build
cd build

echo "Build dbeaver application"

rem git clone --single-branch --branch release_7_0_1 https://github.com/dbeaver/dbeaver.git
git clone https://github.com/dbeaver/dbeaver.git
cd dbeaver
call mvn clean install
cd ..

echo "Build cloudbeaver server"

cd ..\..\server
call mvn clean package

cd ..\deploy

echo "Copy server packages"

xcopy /E /Q ..\server\product\web-server\target\products\io.cloudbeaver.product\all\all\all\* cloudbeaver\server >NUL
copy scripts\run-server.bat cloudbeaver >NUL
mkdir cloudbeaver\workspace\GlobalConfiguration
xcopy /E /Q ..\samples\sample-databases\GlobalConfiguration cloudbeaver\workspace\GlobalConfiguration >NUL
copy ..\samples\sample-databases\cloudbeaver-sample.conf cloudbeaver\conf\cloudbeaver.conf >NUL

echo "Build static content"

cd ..\webapp

call npm i lerna -g
call lerna bootstrap
call lerna run build --scope @dbeaver/dbeaver -- -- --pluginsList=../../../../products/default/plugins-list.js

cd ..\deploy

echo "Copy static content"

xcopy /E /Q ..\webapp\packages\dbeaver\dist cloudbeaver\web >NUL

echo "Cloudbeaver is ready. Run run-server.bat in cloudbeaver folder to start the server."

pause
