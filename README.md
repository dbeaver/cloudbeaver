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

### 24.0.4. 2024-05-06
- Added the ability to stop the process of file upload in the table;
- Row count calculation in the grid can be cancelled for Data Editor and SQL Editor;
- Added the ability to set null values for BLOB and GIS data via the cell's context menu in the table;
- Oracle driver has been updated to version 23.2.0.0.0;
- SQLite driver has been updated to version 3.44.1.0;
- Different bug fixes and enhancements have been made.

### 24.0.3. 2024-04-22
- Unauthorized access vulnerability was fixed;
- Added the ability for users to configure personal settings for the interface, SQL editor, and data viewer through the settings panel;
- Added the ability to backup of the internal database before schema migration (for H2);
- Different bug fixes and enhancements have been made.

### 24.0.2. 2024-04-08
- Added the ability to import data to the database from CSV file;
- Implemented support for utilizing environment variables within connection configurations;
- The ability to select a case for column names has been added to CSV export;
- A new Apache Kyuubi driver has been added;
- Trino driver has been updated to version 438;
- Clickhouse driver has been updated to version 0.6.0-patch2;
- Have enhanced security of H2 connection;
- Different bug fixes and enhancements have been made.

### 24.0.1. 2024-03-25
- Added support for two modes for committing changes to the database:
  - Auto-commit transfers all changes that you make immediately to the database;
  - Manual commit requires your confirmation before committing a change to the database or rolling it back.
- Different bug fixes and enhancements have been made.
