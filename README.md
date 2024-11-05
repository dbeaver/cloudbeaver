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

### 24.2.4. 2024-11-04
- General:
  -    Data export: Added the ability to export JSON values as embedded JSON;
  -    Brazilian Portuguese localization was enhanced (thanks to [brlarini](https://github.com/brlarini));
  -    Fixed a proxy issue that excluded the Content-Type header in responses.
- Administration:
  -    Refreshed design for the User and Teams tab in the Administration panel;
  -    Added an ability to change a user password even if the user is disabled in a system.
### 24.2.3. 2024-10-21
- Important update:
  -    Connections Templates feature is declared as obsolete and will be removed in future releases.
- General:
  -    Data editor enhancements: Rows with focused cells are specially marked to make it easier to locate a position in large tables;
  -    DB2i driver has been updated to version 20.0.7;
  -    The URL mode for PostgreSQL now supports connecting to multiple databases;
  -    The issue with displaying BLOB data types in DuckDB has been resolved.

### 24.2.2. 2024-10-07
- Schemas were added to the SQL autocompletion for PostgreSQL, H2, and SQL Server;
- CloudBeaver can now correctly display negative dates for MySQL database;
- A search option was added for preferences in the Administration part;
- Keyboard navigation has been enhanced. You can now use the arrow keys to move through navigator tree elements and the tab key to switch between editors tabs;
- Sample SQLite database was removed.

### 24.2.1. 2024-09-23
- Chinese localization has been improved (thanks to [cashlifei](https://github.com/cashlifei));
- Environment variables configuration has been improved - now you can configure more variables on the initial stage of the Docker setup;
- SQL Server driver has been updated to version 12.8.0.

### 24.2.0. 2024-09-02
### Changes since 24.1.0:
- General:
  -    French language support was added (thanks to [matthieukhl](https://github.com/matthieukhl))
  -    Added the ability to close editor tabs with the middle mouse button
  -    Added right-click support to open the context menu in the Metadata Editor
  -    The list of forbidden characters for naming and renaming resource manager files has been updated, and now it includes the following characters: / : " \ ' <> | ? *
  -    Application cookies security was improved
- Authentication:
  -    Improved LDAP authentication: added the ability to filter users via service account parameters and ability to specify custom unique user identifiers
- Data Editor:
  -    Added additional notifications about the restricted operations
  -    Enhanced IPv6 and DateTime32 data representation for Clickhouse
  -    Data editing was fixed for DuckDB
- SQL Editor:
  -    SQL Editor auto-completion was enhanced to get column, table, and function names faster
  -    Fixed the dollar-quoted string parsing in the SQL Editor for PostgreSQL
  -    Improved display of the long error messages in the SQL Editor and Log viewer
  -    Changed the save script icon to a floppy disk for better recognition
  -    Improved application behavior when closing a connection - open editors won't be closed on disconnect
- Administration:
  -    Redesigned administration navigation panel - now it is more compact and clear
  -    Added the ability to change the default commit mode for each connection separately
  -    Added the ability to configure the server property rootURI parameter (thanks to [arioko](https://github.com/arioko))
- Databases:
  -    Added the "Keep alive" setting for Db2 LUW and IMB i, Apache Kyuubi, Clickhouse, Firebird, and Trino
  -    Updated Firebird driver to version 5.0.4
  -    DDL generation for Oracle Tablespaces was added (thanks to [pandya09](https://github.com/pandya09))

## Contribution
As a community-driven open-source project, we warmly welcome contributions through GitHub pull requests. 

[We are happy to reward](https://dbeaver.com/help-dbeaver/) our most active contributors every major sprint.
The most significant contribution to our code for the major release 24.2.0 was made by:
1. [matthieukhl](https://github.com/matthieukhl)
