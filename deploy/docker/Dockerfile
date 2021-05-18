FROM adoptopenjdk/openjdk11:x86_64-ubuntu-jdk-11.0.11_9-slim

COPY cloudbeaver /opt/cloudbeaver

EXPOSE 8978

WORKDIR /opt/cloudbeaver/
ENTRYPOINT ["./run-server.sh"]
