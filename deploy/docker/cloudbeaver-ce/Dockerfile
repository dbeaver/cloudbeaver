FROM dbeaver/base-java

MAINTAINER DBeaver Corp, devops@dbeaver.com

ENV DBEAVER_GID=8978
ENV DBEAVER_UID=8978

RUN apt-get update && \
    apt-get upgrade -y

RUN groupadd -g $DBEAVER_GID dbeaver && \
    useradd -g $DBEAVER_GID -M -u $DBEAVER_UID -s /bin/bash dbeaver

COPY cloudbeaver /opt/cloudbeaver
COPY scripts/launch-product.sh /opt/cloudbeaver/launch-product.sh

RUN chown -R $DBEAVER_UID:$DBEAVER_GID /opt/cloudbeaver

EXPOSE 8978
RUN find /opt/cloudbeaver -type d -exec chmod 775 {} \;
WORKDIR /opt/cloudbeaver/

RUN chmod +x "run-server.sh" "/opt/cloudbeaver/launch-product.sh"

ENTRYPOINT ["./run-server.sh"]
