########
######## DBeaver Core component
########
######## 
FROM alpine/git AS core-builder

WORKDIR /dbeaver/core

RUN echo "Clone dbeaver platform" && \
    git clone --depth=1 https://github.com/dbeaver/dbeaver.git

########
######## DBeaver Backend component
########
######## 
FROM maven:3.8-eclipse-temurin-11-alpine AS backend-builder

WORKDIR /dbeaver/cloud/backend

COPY --from=core-builder /dbeaver/core/dbeaver /dbeaver/cloud/dbeaver

RUN echo "Build Cloudbeaver server" && \
    mkdir ./cloudbeaver && \
    mkdir ./cloudbeaver/conf && \
    mkdir ./cloudbeaver/samples && \
    mkdir ./cloudbeaver/workspace && \
    mkdir ./cloudbeaver/web

COPY server /dbeaver/cloud/backend/server-source

RUN echo "Build CloudBeaver server" && \
    cd /dbeaver/cloud/backend/server-source/product/aggregate && \
    mvn clean package -Dheadless-platform:

COPY samples/sample-databases/db /dbeaver/cloud/backend/cloudbeaver/samples
COPY deploy/scripts /dbeaver/cloud/backend/cloudbeaver/scripts
COPY samples /dbeaver/cloud/backend/cloudbeaver/samples

RUN echo "Copy server packages" && \
   mv /dbeaver/cloud/backend/server-source/product/web-server/target/products/io.cloudbeaver.product/all/all/all /dbeaver/cloud/backend/cloudbeaver/server && \
   cp /dbeaver/cloud/backend/cloudbeaver/samples/sample-databases/GlobalConfiguration/.dbeaver/data-sources.json /dbeaver/cloud/backend/cloudbeaver/conf/initial-data-sources.conf && \
   cp /dbeaver/cloud/backend/cloudbeaver/samples/sample-databases/*.conf /dbeaver/cloud/backend/cloudbeaver/conf && \
   mv /dbeaver/cloud/backend/deploy/drivers /dbeaver/cloud/backend/cloudbeaver/drivers

########
######## DBeaver Frontend component
########
######## 
FROM node:16-alpine3.15 AS frontend-builder

RUN yarn global add lerna

WORKDIR /dbeaver/cloud/frontend

COPY webapp /dbeaver/cloud/frontend/webapp

RUN echo "Build static content" && \
    cd webapp && \
    yarn && \
    lerna run bootstrap && \
    lerna run build --no-bail --stream --scope=@cloudbeaver/product-default #-- -- --env source-map

RUN echo "Copy static content" && \
    cp -rp /dbeaver/cloud/frontend/webapp/packages/product-default/lib /dbeaver/cloud/frontend/cloudbeaver-web-build

########
######## DBeaver Cloud Runtime
########
######## 
FROM adoptopenjdk/openjdk11:x86_64-alpine-jre-11.0.14.1_1

RUN apk update && apk add bash

WORKDIR /opt/cloudbeaver
RUN mkdir /opt/cloudbeaver/web

COPY --from=backend-builder /dbeaver/cloud/backend/cloudbeaver /opt/cloudbeaver
COPY --from=frontend-builder /dbeaver/cloud/frontend/cloudbeaver-web-build /opt/cloudbeaver/web

EXPOSE 8978

COPY deploy/scripts/run-server.sh /opt/cloudbeaver/run-server.sh

ENTRYPOINT ["/opt/cloudbeaver/run-server.sh"]
