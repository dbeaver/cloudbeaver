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

### 24.2.0. 2024-09-02
### Changes since 24.1.0:
- General:
  -    French language support was added (thanks to @matthieukhl)
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
  -    Added the ability to configure the server property rootURI parameter (thanks to @arioko)
- Databases:
  -    Added the "Keep alive" setting for Db2 LUW and IMB i, Apache Kyuubi, Clickhouse, Firebird, and Trino
  -    Updated Firebird driver to version 5.0.4
  -    DDL generation for Oracle Tablespaces was added (thanks to @pandya09)

