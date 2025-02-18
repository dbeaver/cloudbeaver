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

### 24.3.5. 2025-02-17
- Administration:
  -    Added system information data to the Product Information tab in the Administration panel. This provides administrators with quick access to essential system details, such as the server deployment type (e.g., Docker, Kubernetes), install path, Java version, and Java parameters;
  -    The global access server URL has been added to the console log, making it easier to locate server installation information directly within the logs;
  -    EntityID or objectGUID is now used to create new LDAP users in CloudBeaver to ensure uniqueness. This change enhances user identification and prevents conflicts while maintaining backward compatibility for existing users.
- General:
  -    Tooltips for metadata objects and SQL Editor tabs now include additional details about catalogs, schemas, and connections.
- Drivers:
  -    MariaDB driver has been updated to version 3.5.1;
  -    SQLite driver has been updated to version 3.48.0.0.

### 24.3.4. 2025-02-03
- Connections:
  -    Added a possibility to switch a database connection to the read-only mode. This mode can be activated in the connection dialog. Administrators can set this mode for any connections, the regular users can set it for their own private connections only;
  -    An ability to use advanced database settings in the URL connection mode was added for Oracle and SQL Server connections.
- General:
  -    Introduced auto-suggestions for column names in the Data Editor filter field to avoid typing mistakes;
  -    Fixed the display of objects with long names (more than 32 characters) in the Navigator tree - now, such names will be displayed entirely and not in a cropped format;
  -    Added the ability to use default spreadsheet names (e.g. Sheet0, Sheet1) for export to XLSX.
- Deployment:
  -    CloudBeaver base Java image was switched to the JDK 21 version. The new Java version will be applied automatically after the product update if you use standard deployment and upgrade scripts;
  -    Changed the permissions of the Docker volumes directory from the "root" user to the "dbeaver" user (uid=8978). To enhance security and prevent any insecure actions by the "root" user. These changes will only affect existing deployments.

### 24.3.3. 2025-01-20
- Administration:
  -    Added an ability to match users from LDAP configuration with CloudBeaver users;
  -    New environment variables were introduced for theme styling, SQL editor, and log viewer settings. You can use them for quick setup during the initial Docker configuration stage.
- General:
  -    An ability to show metadata object comments was added in the Navigator tree. You can enable it in the database navigator settings panel;
  -    Added transaction log viewing for connections with manual commit mode. This allows users to see all modifying statements before committing;
  -    Added an ability to import data in tables without unique keys;
  -    Added an ability to insert data in tables without unique keys;
  -    Added Ctrl + Shift + S (Cmd + Shift + S on Mac) shortcut for "Save As Script" action.

### 24.3.2. 2025-01-06
- Added an ability to specify a user login as an attribute parameter for LDAP providers;
- The collapse of the grouping panel doesn't lead to the full panel cleaning anymore.
  
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
