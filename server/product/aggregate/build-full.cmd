@echo off
set MAVEN_OPTS=-Xmx2048m

call mvn clean verify -Dheadless-platform -T 1C

pause
