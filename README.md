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
- [Deployment instructions](https://github.com/dbeaver/cloudbeaver/wiki/CloudBeaver-Deployment)

## Demo server

You can see a live demo of CloudBeaver here: https://demo.cloudbeaver.io  

[Database access instructions](https://github.com/dbeaver/cloudbeaver/wiki/Demo-Server)

## Changelog

### 25.0.2 2025-04-07
- Data Editor: improved table rendering to scale column width depending on the content.
- Improved Navigation tree performance: lost connection does not lead to the application freezing anymore.
- Different bug fixes and enhancements have been made.

### 25.0.1 2025-03-24
- Improved performance of the export/import functionality by optimizing disk memory consumption;
- Enhanced initial configuration on stage security: if the initial setup time exceeds 1 hour, the server must be restarted.

### 25.0 2025-03-03
### Changes since 24.3.0:
- General:
  -    Added transaction log viewing for connections with manual commit mode. This allows users to see all modifying statements before committing;
  -    Added an ability for all editors to reconnect if a connection has been lost;
  -    Tooltips for metadata objects and SQL Editor tabs now include additional details about catalogs, schemas, and connections;
  -    Added Ctrl + Shift + S (Cmd + Shift + S on Mac) shortcut for the "Save As Script" action;
  -    Updated list of available shortcuts for macOS.
- Administration:
  -    Added system information data to the Product Information tab in the Administration panel. This provides administrators with quick access to essential system details, such as the server deployment type (e.g., Docker, Kubernetes), install path, Java version, and Java parameters;
  -    The global access server URL has been added to the console log, making it easier to locate server installation information directly within the logs;
  -    New environment variables were introduced for theme styling, SQL editor, and log viewer settings. You can use them for quick setup during the initial Docker configuration stage.
- LDAP authorization:
  -    Added the ability to match users from LDAP configuration with CloudBeaver users;
  -    Added an option to specify a user login as an attribute parameter for LDAP providers;
  -    CloudBeaver now uses EntityID or objectGUID to create new LDAP users in CloudBeaver to ensure uniqueness. This change enhances user identification and prevents conflicts while maintaining backward compatibility for existing users.
- Deployment:
  -    CloudBeaver now uses JDK 21 as its base Java image. If you use standard deployment and upgrade scripts, the new Java version will be applied automatically after the product update;
  -    Changed the permission of the Docker volumes directory to enhance security and prevent any insecure actions by the "root" user. All new deployments will use the "dbeaver" user by default. For existing deployments running as the "root" user, this update will automatically adjust file permissions to ensure they are compatible with the new security model. There will be no manual intervention, and the service will continue to run as expected with the updated permissions.
- Connections:
  -    Enabled the possibility of switching a database connection to read-only mode. This mode can be activated in the connection dialog. Administrators can set this mode for any connection, while regular users can set it for their private connections only;
  -    For Oracle and SQL Server connections, advanced database settings can now be used in the URL connection mode.
- Data Editor:
  -    Auto-suggestions for column names in the Data Editor filter field were introduced to avoid typing mistakes;
  -    Introduced the ability to insert data in tables without unique keys: you can import data from CSV files or insert entire rows directly via UI;
  -    The collapse of the grouping panel doesn't lead to the complete panel cleaning anymore.
- Data transfer:
  -    Added the ability to use default spreadsheet names (e.g. Sheet0, Sheet1) for exporting to XLSX;
  -    An option to replace line break characters on any custom value was added when exporting to CSV.
- Navigator tree: 
  -    An option to show metadata object comments was added. You can enable it in the database navigator settings panel;
  -    Introduced the ability to create connections not only on the initial level but in folders and sub-folders directly;
  -    Fixed the display of objects with long names (more than 32 characters) - now, such names will be displayed entirely and not in a cropped format.
- Drivers:
  -    The MariaDB driver has been updated to version 3.5.1;
  -    The SQLite driver has been updated to version 3.48.0.0.

## Contribution
As a community-driven open-source project, we warmly welcome contributions through GitHub pull requests. 

[We are happy to reward](https://dbeaver.com/help-dbeaver/) our most active contributors every major sprint.
The most significant contribution to our code for the major release 24.3.0 was made by:
1. [cashlifei](https://github.com/cashlifei)
