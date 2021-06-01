FROM adoptopenjdk/openjdk11:jdk-11.0.10_9-ubuntu-slim

COPY cloudbeaver /opt/cloudbeaver

EXPOSE 8978

WORKDIR /opt/cloudbeaver/
ENTRYPOINT ["./run-server.sh"]
