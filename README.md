# Cloudbeaver
Cloud Database Manager

### Build cloudbeaver

Cloudbeaver is multi-platform server side application.
It can run on Linux, Windows and MacOS X.

#### Prerequisites

- Java 8, 9, 10, 11 or 12
- Apache Maven
- Node.js
- Yarn

#### Build and deploy

- cd deploy
- ./build.sh

Final artifacts are in `deploy/cloudbeaver`.
You can copy this folder to any other location.

#### Running server

- cd cloudbeaver
- run-server

By default server listens port `8978` (you can change it in conf/cloudbeaver.conf).
You can configure nginx, Apache or any other web server in front of it.

