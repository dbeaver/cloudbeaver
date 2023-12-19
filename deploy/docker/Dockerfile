FROM alpine:3.19

MAINTAINER DBeaver Corp, devops@dbeaver.com

RUN apk update && apk --no-cache add bash nano

ENV LANG=en_US.UTF-8

ENV JAVA_HOME=/opt/java/openjdk

COPY --from=eclipse-temurin:17-alpine $JAVA_HOME $JAVA_HOME

ENV PATH="${JAVA_HOME}/bin:${PATH}"

### Patch java security
COPY java.security* ${JAVA_HOME}/conf/security/java.security

COPY cloudbeaver /opt/cloudbeaver

RUN find /opt/cloudbeaver -type d -exec chmod 775 {} \;

WORKDIR /opt/cloudbeaver/

EXPOSE 8978

ENTRYPOINT ["./run-server.sh"]
