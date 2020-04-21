# Cloudbeaver Community

<img src="https://github.com/dbeaver/cloudbeaver/wiki/images/cloudbeaver-logo.png" width="250"/>

Cloud Database Manager - Community Edition.  
Cloudbeaver is a web server which provides rich web interface. Server itself is a Java application, web part is written on TypeScript and React.  
It is free to use and open-source (licensed under [Apache 2](https://github.com/dbeaver/cloudbeaver/blob/devel/LICENSE) license).  
See out [WIKI](https://github.com/dbeaver/cloudbeaver/wiki) for more details.  

## Build cloudbeaver

Cloudbeaver is multi-platform server side application.
It can run on Linux, Windows and MacOS X.

[Detailed instructions](https://github.com/dbeaver/cloudbeaver/wiki/Build-and-deploy)

### Build and deploy

After all required packages are installed:

```sh
git clone https://github.com/dbeaver/cloudbeaver.git
cd cloudbeaver/deploy
./build.sh
cd cloudbeaver
./run-server.sh
```
By default server listens port `8978` (you can change it in conf/cloudbeaver.conf). So just navigate to http://localhost:8978.
You can configure nginx, Apache or any other web server in front of it.

## Test server

You can see live demo of Cloudbeaver here:
[TBD]

