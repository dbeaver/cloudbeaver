FROM adoptopenjdk:11-jre-hotspot

RUN apt-get install -y supervisor

RUN mkdir -p /opt/cloudbeaver

COPY ../cloudbeaver/* /opt/cloudbeaver/
RUN ["chmod", "+x", "/opt/cloudbeaver/run-server.sh"]

COPY ../supervisord/cloudbeaver.conf /etc/supervisor/conf.d/cloudbeaver.conf

EXPOSE 8978

CMD ["/usr/bin/supervisord"]

# ENTRYPOINT ["/opt/cloudbeaver/run-server.sh"]
