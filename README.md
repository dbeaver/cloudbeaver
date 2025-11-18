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

### 25.2.5 2025-11-17
- A "Show SQL" button has been added to the Data Editor and the grouping panel, enabling users to inspect the exact SQL query behind displayed results—helping validate data transformations, debug query logic, and ensure analytical accuracy;
- The search option has been added to the default catalog/schema selector in the SQL Editor's main toolbar;
- The SQL Server driver has been updated to version 13.2.1.

### 25.2.4 2025-11-03
- A confirmation prompt has been added for potentially dangerous queries in the SQL Editor to help prevent unintended execution. You can customize this behavior in Preferences > SQL Editor;
- The value panel in the Data Editor has been redesigned to provide users with more space for viewing and editing data. Tab buttons for different data type visualizations are now aligned on a single level, creating a cleaner layout;
- Permission configuration for connections was simplified, providing a clearer appearance and improved performance.

### 25.2.3 2025-10-20
- Added visualization for column reordering in the Data Editor;
- Fixed the critical issue with duplicating the execution of queries executed by a shortcut in the SQL Editor;
- Fixed the critical vulnerability (CVE-2025-61927) in the Happy DOM library. The library was updated to version 20.0.2.

### 25.2.2 2025-10-06
- Replaced true/false text with intuitive checkboxes for boolean values in the metadata editor, making editing easier and faster;
- Keyboard navigation was improved across the application. Additional shortcuts are available in the main info panel (top-right corner). To help you discover them faster, relevant keyboard shortcuts are also shown directly in the tooltips of Data Editor buttons;
- Fixed an issue in the Data Editor where resizing one column in a wide table would cause previously resized columns to revert to their original width. Users can resize multiple columns as intended.

### 25.2.1 2025-09-22
- Autocomplete values in SQL Editor are ordered alphabetically to simplify object search;
- "Show all databases" setting was added on the connection page for MySQL and MariaDB;
- Different bug fixes and enhancements have been made.

### 25.2.0 2025-09-01
### Changes since 25.1.0:
- Administration:
  -    Added support for multiple server URLs to accommodate different access policies for internal and external users, improving flexibility in network-restricted environments. To set it up, use the Allowed Server URLs field in the Server configuration within the Administration section;
  -    Added the Force HTTPS mode setting in Server Configuration to enforce redirecting from HTTP to HTTPS. This setting helps avoid a potential man-in-the-middle attack. This setting is turned off by default. Please remember to configure your proxy before enabling;
  -    Added the CLOUDBEAVER_BIND_SESSION_TO_IP option to improve session security by linking user sessions to their IP address. It is disabled by default. When enabled, this helps protect against certain types of session hijacking attacks, where an attacker could try to take over a user’s session. Note: Users will be logged out automatically on the IP address change (switching networks or using mobile data);
  -    A password confirmation field has been added for administrators in the Easy Config section to prevent accidental misconfigurations.
- SQL Editor:
  -    Changed the default engine used for autocompletion in the SQL Editor. This Semantic engine offers improved suggestions for database objects, keywords, and functions. You can switch back to the Legacy engine in Preferences > SQL Editor;
  -    A “Clear” button was added to the output panel.
- Data Editor:
  -    Column descriptions were added in the Data Editor under column names to provide more metadata context. You can disable this in Preferences > Data Viewer;
  -    Added an ability to review the script before execution when users edit tables without primary keys.
- General:
  -    Added a new welcome screen for a freshly opened application. This screen contains shortcuts to create a new connection, open SQL Editor, or documentation;
  -    Added a search panel for SQL Editor and Value panel: press Ctrl/Cmd + F to open a panel that allows searching and replacing by keyword or regular expression;
  -    Changed the data transfer mechanism to avoid intermediate file creation. The parameter dataExportFileSizeLimit was removed from the server configuration as deprecated;
  -    The CloudBeaver default theme matches the device theme by default now. You can change this behavior in user preferences under the Theme section;
  -    Added the option to display tabs across multiple rows, allowing you to see all tabs without scrolling. You can enable this in Preferences > Interface;
  -    Improved dark theme accessibility by enhancing color contrast across the app for better readability and compliance with accessibility standards;
  -    The database navigator now automatically hides empty folders in shared projects, reducing visual clutter and speeding up the process of finding active connections.
- Databases and drivers:
  -    Clickhouse: fixed the presentation of tuples and map data types in the Data Editor;
  -    Databend database support has been added (thanks to @hantmac);
  -    DuckDB: driver has been updated to version 1.3;
  -    MySQL: Improved performance when retrieving foreign keys metadata;
  -    PostgreSQL: fixed misplaced comment for table DDL generation.

## Contribution
As a community-driven open-source project, we warmly welcome contributions through GitHub pull requests. 

[We are happy to reward](https://dbeaver.com/help-dbeaver/) our most active contributors every major sprint.
The most significant contribution to our code for the major release 25.2.0 was made by:
1. [hantmac](https://github.com/hantmac) - added support for Databend in CloudBeaver Community Edition.
