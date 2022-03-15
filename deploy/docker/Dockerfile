FROM eclipse-temurin:11.0.14.1_1-jre-focal
#adoptopenjdk/openjdk11:jdk-11.0.12_7-ubuntu-slim

COPY cloudbeaver /opt/cloudbeaver

EXPOSE 8978

WORKDIR /opt/cloudbeaver/
ENTRYPOINT ["./run-server.sh"]
