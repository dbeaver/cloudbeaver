@echo off
set MAVEN_OPTS=-Xmx2048m

call mvn clean install -Dheadless-platform -T 1C

pause
