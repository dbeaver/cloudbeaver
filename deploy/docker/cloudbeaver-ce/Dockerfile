FROM dbeaver/base-java

MAINTAINER DBeaver Corp, devops@dbeaver.com

RUN apt-get update && \
    apt-get upgrade -y

COPY cloudbeaver /opt/cloudbeaver
COPY scripts/launch-product.sh /opt/cloudbeaver/launch-product.sh

# Variables DBEAVER_<UID|GID> are inherited from the dbeaver/base-java image
RUN chown -R $DBEAVER_UID:$DBEAVER_GID /opt/cloudbeaver

EXPOSE 8978
RUN find /opt/cloudbeaver -type d -exec chmod 775 {} \;
WORKDIR /opt/cloudbeaver/

RUN chmod +x "run-server.sh" "/opt/cloudbeaver/launch-product.sh"

ENTRYPOINT ["./launch-product.sh"]
