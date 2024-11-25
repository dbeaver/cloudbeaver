@echo off

rem command line arguments

echo Clone and build Cloudbeaver

IF EXIST drivers rmdir /S /Q drivers
IF EXIST cloudbeaver rmdir /S /Q cloudbeaver
mkdir cloudbeaver
mkdir cloudbeaver\server
mkdir cloudbeaver\conf
mkdir cloudbeaver\workspace
mkdir cloudbeaver\web

echo Pull cloudbeaver platform

cd ..\..

echo Pull dbeaver platform

IF NOT EXIST dbeaver git clone https://github.com/dbeaver/dbeaver.git
IF NOT EXIST dbeaver-common git clone https://github.com/dbeaver/dbeaver-common.git
IF NOT EXIST dbeaver-jdbc-libsql git clone https://github.com/dbeaver/dbeaver-jdbc-libsql.git

cd cloudbeaver\deploy

echo Build cloudbeaver server

cd ..\server\product\aggregate
call mvn clean verify -Dheadless-platform

cd ..\..\..\deploy

echo Copy server packages

xcopy /E /Q ..\server\product\web-server\target\products\io.cloudbeaver.product\all\all\all\* cloudbeaver\server >NUL
copy scripts\* cloudbeaver >NUL
mkdir cloudbeaver\samples


copy ..\config\core\* cloudbeaver\conf >NUL
copy ..\config\DefaultConfiguration\GlobalConfiguration\.dbeaver\data-sources.json cloudbeaver\conf\initial-data-sources.conf >NUL

move drivers cloudbeaver >NUL

echo "Build static content"

mkdir .\cloudbeaver\web

cd ..\webapp

call yarn
cd .\packages\product-default
call yarn run bundle

if %ERRORLEVEL% neq 0 (
    echo 'Application build failed'
    exit /b %ERRORLEVEL%
)

cd ..\..\
call yarn test

if %ERRORLEVEL% neq 0 (
    echo 'Frontend tests failed'
    exit /b %ERRORLEVEL%
)

cd ..\deploy

echo "Copy static content"

xcopy /E /Q ..\webapp\packages\product-default\lib cloudbeaver\web >NUL

echo "Cloudbeaver is ready. Run run-server.bat in cloudbeaver folder to start the server."

pause
