@echo off
for /f %%a in ('dir /B /S server\plugins\org.eclipse.equinox.launcher*.jar') do SET launcherJar="%%a"

echo "Starting Cloudbeaver Server"

IF NOT EXIST workspace\.metadata (
    mkdir workspace\GlobalConfiguration\.dbeaver\
    copy conf\initial-data-sources.conf workspace\GlobalConfiguration\.dbeaver\data-sources.json
)

java %JAVA_OPTS% -jar %launcherJar% -product io.cloudbeaver.product.ce.product -web-config conf/cloudbeaver.conf -nl en -registryMultiLanguage
