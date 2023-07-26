FROM eclipse-temurin:17.0.4.1_1-jre-focal

COPY cloudbeaver /opt/cloudbeaver

EXPOSE 8978
RUN find /opt -type d -exec chmod 775 {} \;
WORKDIR /opt/cloudbeaver/
ENTRYPOINT ["./run-server.sh"]
