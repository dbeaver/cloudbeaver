FROM ubuntu:23.04

MAINTAINER DBeaver Corp, devops@dbeaver.com

ENV JAVA_HOME=/opt/java/openjdk
COPY --from=eclipse-temurin:17 $JAVA_HOME $JAVA_HOME
ENV PATH="${JAVA_HOME}/bin:${PATH}"

COPY cloudbeaver /opt/cloudbeaver

EXPOSE 8978
RUN find /opt/cloudbeaver -type d -exec chmod 775 {} \;
WORKDIR /opt/cloudbeaver/
ENTRYPOINT ["./run-server.sh"]
