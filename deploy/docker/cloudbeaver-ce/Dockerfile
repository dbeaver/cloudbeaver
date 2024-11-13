FROM dbeaver/base-java

MAINTAINER DBeaver Corp, devops@dbeaver.com

RUN useradd -m -s /bin/bash dbeaver && \ 
    apt-get update; \
    apt-get upgrade -y; 
    
COPY cloudbeaver /opt/cloudbeaver
COPY docker/cloudbeaver-ce/upgrade.sh /opt/cloudbeaver/upgrade.sh
RUN chmod +x /opt/cloudbeaver/upgrade.sh
RUN chown -R dbeaver:dbeaver /opt/cloudbeaver

EXPOSE 8978
RUN find /opt/cloudbeaver -type d -exec chmod 775 {} \;
WORKDIR /opt/cloudbeaver/

ENTRYPOINT ["./upgrade.sh"]
