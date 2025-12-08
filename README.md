<img src="https://github.com/dbeaver/cloudbeaver/wiki/images/cloudbeaver-logo.png" align="right" width="250"/>

# CloudBeaver Community

Cloud Database Manager - Community Edition.  
CloudBeaver is a web server that provides a rich web interface. The server itself is a Java application, and the web part is written in TypeScript and React.  
It is free to use and open-source (licensed under [Apache 2](https://github.com/dbeaver/cloudbeaver/blob/devel/LICENSE) license).  
See our [WIKI](https://github.com/dbeaver/cloudbeaver/wiki) for more details. 

<a><img src="https://github.com/dbeaver/cloudbeaver/wiki/images/connection-creation-demo.png" width="400"/></a>
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

### 25.3.0 2025-12-01
### Changes since 25.2.0:
  - Administration:
    - Permission configuration for connections has been simplified, providing a clearer appearance and improved performance;
    - LDAP authentication now supports case-insensitive Distinguished Names (DNs), allowing login with mixed-case DNS.
  - Security:
    - Fixed a security issue in the Spatial Viewer for the HTML content to prevent a third-party script execution;
    - Fixed the critical vulnerability (CVE-2025-61927) in the Happy DOM library. The library was updated to version 20.0.2.
  - SQL Editor:
    - A confirmation prompt has been added to the SQL Editor to prevent accidental execution of potentially dangerous queries. You can customize this behavior in Preferences > SQL Editor;
    - A search field has been added to the catalog/schema selector on the main toolbar for easy navigation;
    - Alphabetical order has been added to the autocomplete values in the SQL Editor to simplify object search;
    - Added support for temporary tables in semantic analysis.
  - Data Editor:
    - The ability to review the database query after applying filters and sorting in the Data Editor, Grouping panel, and Result sets has been added. The new Show SQL button is placed on the Filter panel;
    - The value panel in the Data Editor has been redesigned to give users more space for viewing and editing data. Tab buttons for different data type visualizations are now aligned on a single level, creating a cleaner layout;
    - Added visualization for column reordering in the Data Editor;
    - Fixed an issue in the Data Editor where resizing one column in a wide table caused previously resized columns to revert to their original width. Users can resize multiple columns as intended.
  - General:
    - A reorder tabs option has been added to the application, allowing users to set editor tabs in custom positions;
    - Keyboard navigation has been improved across the application. Additional shortcuts are available in the main info panel (top-right corner) to help discover them faster. Relevant keyboard shortcuts are also shown in the tooltips of Data Editor buttons;
    - Boolean values have been replaced with intuitive checkboxes instead of the true/false text in the metadata editor, making editing easier and faster;
    - The database navigator now automatically hides empty subfolders in shared projects, reducing visual clutter;
  - Databases and drivers:
    - ClickHouse: query canceling support has been added;
    - DuckDB: fixed an issue where catalog selection was lost upon disconnection;
    - PostgreSQL: fixed support for GIS data types;
    - SQL Server: the driver has been updated to version 13.2.1;
    - The "Show all databases" setting has been added on the connection page for MySQL and MariaDB.
## Contribution
As a community-driven open-source project, we warmly welcome contributions through GitHub pull requests. 

[We are happy to reward](https://dbeaver.com/help-dbeaver/) our most active contributors every major sprint.
