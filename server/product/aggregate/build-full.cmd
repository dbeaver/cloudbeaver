@echo off
set MAVEN_OPTS=-Xmx2048m

call mvn clean package -Dheadless-platform

pause
