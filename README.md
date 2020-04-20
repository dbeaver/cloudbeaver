<img src="https://github.com/dbeaver/cloudbeaver/wiki/images/cloudbeaver-logo.png" align="right" width="250"/>

# Cloudbeaver
Cloud Database Manager.  
Cloudbeaver is a web server which provides rich web interface. Server itself is a Java application, web part is written on TypeScript and React.  

## Build cloudbeaver

Cloudbeaver is multi-platform server side application.
It can run on Linux, Windows and MacOS X.

### Prerequisites

* Java 8, 9, 10, 11 or 12 (AdopOpenJDK is recommended).
* Apache Maven
* Node.js
* Yarn

### Build and deploy

```sh
git clone https://github.com/dbeaver/cloudbeaver.git
cd cloudbeaver/deploy
./build.sh
```

Final artifacts can be found in deploy/cloudbeaver.

### Running server
```sh
cd cloudbeaver
./run-server.sh
```
By default server listens port `8978` (you can change it in conf/cloudbeaver.conf). So just navigate to http://localhost:8978.
You can configure nginx, Apache or any other web server in front of it.

## Test server

You can see live demo of Cloudbeaver here:
[TBD]

