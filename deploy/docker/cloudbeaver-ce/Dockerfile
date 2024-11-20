FROM dbeaver/base-java

MAINTAINER DBeaver Corp, devops@dbeaver.com

RUN useradd -m -s /bin/bash dbeaver && \ 
    apt-get update; \
    apt-get upgrade -y; 
    
COPY cloudbeaver /opt/cloudbeaver
COPY scripts/launch-product.sh /opt/cloudbeaver/launch-product.sh
RUN chmod +x /opt/cloudbeaver/launch-product.sh
RUN chown -R dbeaver:dbeaver /opt/cloudbeaver

EXPOSE 8978
RUN find /opt/cloudbeaver -type d -exec chmod 775 {} \;
WORKDIR /opt/cloudbeaver/

ENTRYPOINT ["./launch-product.sh"]
