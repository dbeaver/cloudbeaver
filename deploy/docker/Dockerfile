FROM adoptopenjdk/openjdk11:x86_64-ubuntu-jdk-11.0.7_10

RUN apt-get update
RUN apt-get install -y nano

COPY cloudbeaver /opt/cloudbeaver

EXPOSE 8978

WORKDIR /opt/cloudbeaver/
ENTRYPOINT ["./run-server.sh"]
