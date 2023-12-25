FROM alpine:3.19

MAINTAINER DBeaver Corp, devops@dbeaver.com

ENV LANG='en_US.UTF-8' LANGUAGE='en_US:en' LC_ALL='en_US.UTF-8'

RUN set -eux; \
    apk add --no-cache \
        # java.lang.UnsatisfiedLinkError: libfontmanager.so: libfreetype.so.6: cannot open shared object file: No such file or directory
        # java.lang.NoClassDefFoundError: Could not initialize class sun.awt.X11FontManager
        # https://github.com/docker-library/openjdk/pull/235#issuecomment-424466077
        fontconfig ttf-dejavu \
        # utilities for keeping Alpine and OpenJDK CA certificates in sync
        # https://github.com/adoptium/containers/issues/293
        ca-certificates p11-kit-trust \
        # locales ensures proper character encoding and locale-specific behaviors using en_US.UTF-8
        musl-locales musl-locales-lang \
        # jlink --strip-debug on 13+ needs objcopy: https://github.com/docker-library/openjdk/issues/351
        # Error: java.io.IOException: Cannot run program "objcopy": error=2, No such file or directory
        binutils \
        tzdata \
        bash \
        nano \
        curl \
    ; \
    rm -rf /var/cache/apk/*

ENV JAVA_VERSION jdk-17.0.9+9

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
