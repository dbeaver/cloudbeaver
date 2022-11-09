ARG ARCH=
FROM ${ARCH}/eclipse-temurin:17.0.4.1_1-jre-focal
#adoptopAenjdk/openjdk11:jdk-11.0.12_7-ubuntu-slim

COPY cloudbeaver /opt/cloudbeaver

EXPOSE 8978

WORKDIR /opt/cloudbeaver/
ENTRYPOINT ["./run-server.sh"]
