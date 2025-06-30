ARG BASE_JAVA_TAG="stable"
FROM dbeaver/base-java:${BASE_JAVA_TAG}

MAINTAINER DBeaver Corp, devops@dbeaver.com

ENV DBEAVER_GID=8978
ENV DBEAVER_UID=8978

RUN groupadd -g $DBEAVER_GID dbeaver && \
    useradd -g $DBEAVER_GID -m -u $DBEAVER_UID -s /bin/bash dbeaver

COPY cloudbeaver /opt/cloudbeaver

EXPOSE 8978
RUN find /opt/cloudbeaver -type d -exec chmod 775 {} \;
RUN chown -R dbeaver:dbeaver /opt/cloudbeaver
WORKDIR /opt/cloudbeaver/

RUN chmod +x "run-server.sh"

USER dbeaver

ENTRYPOINT ["./run-server.sh"]
