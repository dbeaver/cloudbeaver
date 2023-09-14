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

### CloudBeaver 23.2.0 - 2023-09-04

Changes since 23.1.0

- Performance:
   - Pagination has been added to the Navigation tree and metadata viewer, allowing working with more than 1000 database items;
- Access Management:
   - Access permissions can be specified for pre-configured connections via the configuration file;
   - Reverse Proxy authentication now includes the option to provide users' First name and Last name;
- Authorization:
   - The SSL option is now available for establishing connections in MySQL, PostgreSQL, Clickhouse;
- Connections:
   - Connections are consistently displayed now when they are pre-configured into the workspace in the Global Configuration json file
- Navigation tree:
   - The filters for the Navigation tree now allow hiding and showing schemas within the interface.
   - The search request considers file names and excludes the .sql file extension for now;
- Data Editor:
   - The ability to rearrange columns in the Data Editor has been added;
   - The ability to use custom functions in the Grouping panel has been added;
- Administration:
   - New Settings panel displays the product configuration settings such as Minimum fetch size, Maximum fetch size, and Default fetch size from the Data Editor;
   - "Connection Management" tab has been renamed to "Connection Templates" - now only connection templates are displayed;
- SQL Editor:
   - Users can simultaneously edit resources for now, allowing them to work together;
   - Support for displaying tables with nested arrays of objects has been added;
   - The ability to compress export files allowed to increase in download speed, especially for larger files;
   - UX in the search bar has been improved  - users can delete a query or request by clicking on the cross icon;
- Driver management:
   - Custom settings have been added to the interface for the following dialogue connections: SQLite, DB2, SQL Server, MySQL, Oracle and PostgreSQL;
   - Trino driver has been updated;
- Security:
   - Password autofill functionality was removed;
   - The "eye" icon for password fields has been removed - the passwords entered into fields will not be displayed in the interface for now;
- Many small bug fixes, enhancements, and improvements have been made


### Old CloudBeaver releases

You can find information about earlier releases on the CloudBeaver wiki https://github.com/dbeaver/cloudbeaver/wiki/Releases.

