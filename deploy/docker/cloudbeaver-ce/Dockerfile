FROM dbeaver/base-java

MAINTAINER DBeaver Corp, devops@dbeaver.com

RUN apt-get update; \
    apt-get upgrade -y; 
    
COPY cloudbeaver /opt/cloudbeaver

EXPOSE 8978
RUN find /opt/cloudbeaver -type d -exec chmod 775 {} \;
WORKDIR /opt/cloudbeaver/
ENTRYPOINT ["./run-server.sh"]
