FROM timbru31/java-node:11-azul-alpine-jdk

WORKDIR /app/cloudbeaver

RUN yarn global add lerna
RUN apk add maven bash git

COPY ./ ./

RUN cd deploy && ./build.sh

EXPOSE 8978

CMD cd deploy/cloudbeaver && ./run-server.sh