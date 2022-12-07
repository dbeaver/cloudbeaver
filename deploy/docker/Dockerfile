FROM eclipse-temurin:17.0.4.1_1-jre-focal

RUN groupadd cloudbeaver
RUN useradd -ms /bin/bash -g cloudbeaver cloudbeaver
COPY --chown=cloudbeaver:cloudbeaver cloudbeaver /opt/cloudbeaver

EXPOSE 8978

# USER cloudbeaver
WORKDIR /opt/cloudbeaver/
ENTRYPOINT ["./run-server.sh"]
