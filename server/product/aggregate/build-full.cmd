@echo off
set MAVEN_OPTS=-Xmx2048m

call "..\..\..\..\dbeaver-common\mvnw.cmd" clean verify -Dheadless-platform -T 1C

pause
