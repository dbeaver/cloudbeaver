<img src="https://github.com/dbeaver/cloudbeaver/wiki/images/cloudbeaver-logo.png" align="right" width="250"/>

# CloudBeaver Community

Cloud Database Manager - Community Edition.  
CloudBeaver is a web server that provides a rich web interface. The server itself is a Java application, and the web part is written in TypeScript and React.  
It is free to use and open-source (licensed under [Apache 2](https://github.com/dbeaver/cloudbeaver/blob/devel/LICENSE) license).  
See our [WIKI](https://github.com/dbeaver/cloudbeaver/wiki) for more details. 

<img src="https://github.com/dbeaver/cloudbeaver/wiki/images/connection-creation-demo.png" width="400"/>
<img src="https://github.com/dbeaver/cloudbeaver/wiki/images/gis-demo.png" width="400"/>
<img src="https://github.com/dbeaver/cloudbeaver/wiki/images/data-transfer-demo.png" width="400"/>
<img src="https://github.com/dbeaver/cloudbeaver/wiki/images/sql-editor-demo.png" width="400"/>

## Run in Docker

- [Official Docker repository](https://hub.docker.com/r/dbeaver/cloudbeaver)
- [Running instructions](https://github.com/dbeaver/cloudbeaver/wiki/Run-Docker-Container)

## Demo server

You can see a live demo of CloudBeaver here: https://demo.cloudbeaver.io  

[Database access instructions](https://github.com/dbeaver/cloudbeaver/wiki/Demo-Server)

## Changelog

### 24.3.1. 2024-12-23
- Added an ability to reconnect for all editors if a connection has been lost;
- Added an option to replace line break characters on any custom value when exporting to CSV;
- Added an ability to create connections in the Navigation tree not only on the initial level but in folders and sub-folders directly;
- Updated list of available shortcuts for MacOS.

### 24.3.0. 2024-12-02
### Changes since 24.2.0:
- General:
  -    The connections Templates feature is declared obsolete and will be removed in future releases;
  -    Data export: Added the ability to export JSON values as embedded JSON;
  -    Fixed a proxy issue that excluded the Content-Type header in responses;
  -    Data editor enhancements: Rows with focused cells are specially marked to make it easier to locate a position in large tables;
  -    Keyboard navigation has been enhanced. You can now use the arrow keys to move through navigator tree elements and the tab key to switch between editors' tabs;
  -    Sample SQLite database was removed;
  -    Chinese localization has been improved (thanks to @cashlifei);
  -    Brazilian Portuguese localization was enhanced (thanks to @brlarini).
- Administration:
  -    Updated user storage mechanism: New user logins are now stored in lowercase to prevent duplicate entries (e.g., "ADMIN" and "admin"). Note: This update does not affect previously created user logins;
  -    Added an ability to change a user password even if the user is disabled in a system;
  -    Refreshed design for the User and Teams tab in the Administration panel;
  -    A new setting in Global Preferences was added to restrict data import for non-admin users;
  -    A search option was added for preferences in the Administration part;
  -    Added detailed logging of GraphQL queries in the server logs, including all provided variables, for improved debugging and monitoring;
  -    Environment variables configuration has been improved - now you can configure more variables on the initial stage of the Docker setup.
- Databases:
  -    PostgreSQL, Greenplum, CockroachDB: The URL mode now supports connecting to multiple databases;
  -    PostgreSQL, H2, and SQL Server: Schemas were added to the SQL autocompletion;
  -    MySQL: CloudBeaver can now correctly display negative dates;
  -    DuckDB: The issue with displaying BLOB data types has been resolved.
- Drivers:
  -    A new LibSQL/Turso driver was added;
  -    SQL Server driver has been updated to version 12.8.0;
  -    DB2i driver has been updated to version 20.0.7.

## Contribution
As a community-driven open-source project, we warmly welcome contributions through GitHub pull requests. 

[We are happy to reward](https://dbeaver.com/help-dbeaver/) our most active contributors every major sprint.
The most significant contribution to our code for the major release 24.3.0 was made by:
1. [cashlifei](https://github.com/cashlifei)
