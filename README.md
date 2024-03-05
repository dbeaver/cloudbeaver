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


### 24.0.0. 2024-03-04
  - Changes since 23.3.0:

- Main updates:
  - Have enhanced security for unauthorised access;
  - Have added a password policy for the local authorization. Password parameters can be set in the configuration file;
  - Have added validation for mandatory fields in all forms to create and edit entities;
  - Have added an ability to edit the default preferences of the following parts: interface, tools and data viewer in the settings panel in the administrative part;
- Performance:
  - Have improved the performance of the server.
- Administration:
  - Have added the ability to configure reverse proxy header name and redirect URL at logout. Now the administrator can configure all settings. The delimiter symbol for the reverse proxy team headers is configurable;
- Preferences:
  - Have added the ability in the admin panel to customise copying in the Tables and Values panel for all users except the administrator;
  - Have added the ability to disable alias autocomplete for all users.
- Access Management:
  - A default user group was added to the product. This group includes all users which could not be deleted.
- Connections:
  - The 'Keep alive' option has been added to the connection settings to keep the connection active even in case of inactivity.
- Data Editor: 
  - Have added the ability to view decoded binary-type data in the Value panel;
  - Text wrap is activated by default for texts and BLOBs in the Values panel for better visibility. The user can switch to the one-line mode using a button on the toolbar;
  - Have added the ability to display full text for a string data type in the Value panel;
  - Have added the ability to display the OpenStreetMap layer with the coordinate system ESPG 4326.
- Resource management:
  - Read-only scripts now have a padlock icon.
- Databases:
  - The DuckDB driver has been added;
  - Updated PostgreSQL driver to 42.5.2;
  - ClickHouse Legacy driver has been removed to prevent potential vulnerability issues;
  - Updated MariaDB driver to version 3.3.2.
- Different bug fixes and enhancements have been made.
