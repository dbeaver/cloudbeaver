@rem echo off
for /f %%a in ('dir /B /S server\plugins\org.eclipse.equinox.launcher*.jar') do SET launcherJar="%%a"

echo "Starting Cloudbeaver Server"

java -jar %launcherJar% -product io.cloudbeaver.product.ce.product -web-config conf/cloudbeaver.conf -nl en -registryMultiLanguage -vmargs -Xmx2048M
