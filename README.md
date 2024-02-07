# CloudBeaver Community

<img src="https://github.com/dbeaver/cloudbeaver/wiki/images/cloudbeaver-logo.png" width="250"/>

Cloud Database Manager - Community Edition.  
CloudBeaver is a web server which provides rich web interface. Server itself is a Java application, web part is written on TypeScript and React.  
It is free to use and open-source (licensed under [Apache 2](https://github.com/dbeaver/cloudbeaver/blob/devel/LICENSE) license).  
See out [WIKI](https://github.com/dbeaver/cloudbeaver/wiki) for more details.  

![](https://github.com/dbeaver/cloudbeaver/wiki/images/demo_screenshot_1.png)

## Run in Docker

- [Official Docker repository](https://hub.docker.com/r/dbeaver/cloudbeaver)
- [Running instructions](https://github.com/dbeaver/cloudbeaver/wiki/Run-Docker-Container)

## Demo server

You can see live demo of CloudBeaver here: https://demo.cloudbeaver.io  

[Database access instructions](https://github.com/dbeaver/cloudbeaver/wiki/Demo-Server)

## Changelog

### 23.3.4. 2024-02-05
- Text wrap is activated by default for texts and BLOBs in the Values panel for better visibility. User can switch to the one-line mode using a button on the toolbar;
- Added the ability to edit the default preferences of the following parts: interface, tools and data viewer in the settings panel in the administrative part;
- Added ability to configure reverse proxy header name and redirect URL at logout. Admin will now be able to configure all settings;
- Update PostgreSQL driver to 42.5.2;
- Added the ability to display the OpenStreetMap layer with the default coordinate system ESPG 4326;
- ClickHouse Legacy driver has been removed to prevent potential vulnerability issues;
- Different bug fixes and enhancements have been made.

### 23.3.3. 2024-01-22
- Added password policy for the local authorization. Password parameters can be set in the configuration file;
- The 'Keep alive' option has been added to the connection settings to keep the connection active even in case of inactivity;
- Added ability to display full text for a string data type in value panel;
- The DuckDB driver has been added;
- Different bug fixes and enhancements have been made.

### 23.3.2. 2024-01-08
- Added the ability to view decoded binary-type data in the Value panel;
- Enhanced security for unauthorized access;
- Different bug fixes and enhancements have been made.



### Old CloudBeaver releases

You can find information about earlier releases on the CloudBeaver wiki https://github.com/dbeaver/cloudbeaver/wiki/Releases.

