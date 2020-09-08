FROM adoptopenjdk/openjdk11:x86_64-ubuntu-jdk-11.0.7_10

RUN apt-get update
RUN apt-get install -y supervisor

#RUN mkdir -p /opt/cloudbeaver

COPY cloudbeaver /opt/cloudbeaver
#RUN ["chmod", "+x", "/opt/cloudbeaver/run-server.sh"]

COPY supervisor/cloudbeaver.conf /etc/supervisor/conf.d/cloudbeaver.conf

EXPOSE 8978

#CMD ["/usr/bin/supervisord"]

WORKDIR /opt/cloudbeaver/
ENTRYPOINT ["./run-server.sh"]
