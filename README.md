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
