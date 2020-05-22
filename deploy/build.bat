@echo off
echo Clone and build Cloudbeaver

IF EXIST drivers rmdir /S /Q drivers
IF EXIST cloudbeaver rmdir /S /Q cloudbeaver
mkdir cloudbeaver
mkdir cloudbeaver\server
mkdir cloudbeaver\conf
mkdir cloudbeaver\workspace
mkdir cloudbeaver\web

echo Pull dbeaver platform

cd ../..
IF NOT EXIST dbeaver git clone --depth 1 https://github.com/dbeaver/dbeaver.git
cd dbeaver
git pull
cd ..\cloudbeaver\deploy

echo Build cloudbeaver server

cd ..\server\product\aggregate
call mvn clean package -Dheadless-platform

cd ..\..\..\deploy

echo Copy server packages

xcopy /E /Q ..\server\product\web-server\target\products\io.cloudbeaver.product\all\all\all\* cloudbeaver\server >NUL
copy scripts\* cloudbeaver >NUL
mkdir cloudbeaver\workspace\GlobalConfiguration
xcopy /E /Q ..\samples\sample-databases\GlobalConfiguration cloudbeaver\workspace\GlobalConfiguration >NUL
copy ..\samples\sample-databases\*.conf cloudbeaver\conf >NUL
move drivers cloudbeaver >NUL

echo Build static content

cd ..\webapp

call yarn run bootstrap
call yarn run build

cd ..\deploy

echo Copy static content

xcopy /E /Q ..\webapp\packages\cloudbeaver\dist cloudbeaver\web >NUL

echo Cloudbeaver is ready. Run run-server.bat in cloudbeaver folder to start the server.

pause
