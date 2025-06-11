FROM dbeaver/base-java

MAINTAINER DBeaver Corp, devops@dbeaver.com

ENV DBEAVER_GID=8978
ENV DBEAVER_UID=8978

RUN groupadd -g $DBEAVER_GID dbeaver && \
    useradd -g $DBEAVER_GID -m -u $DBEAVER_UID -s /bin/bash dbeaver

COPY cloudbeaver /opt/cloudbeaver
COPY scripts/launch-product.sh /opt/cloudbeaver/launch-product.sh

EXPOSE 8978
RUN find /opt/cloudbeaver -type d -exec chmod 775 {} \;
WORKDIR /opt/cloudbeaver/

RUN chmod +x "run-server.sh" "/opt/cloudbeaver/launch-product.sh"

ENTRYPOINT ["./launch-product.sh"]
