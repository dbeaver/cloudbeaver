<img src="https://github.com/dbeaver/cloudbeaver/wiki/images/cloudbeaver-logo.png" alt="CloudBeaver logo" align="right" width="250"/>

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

### 26.0.1 2026-03-23

  - Data Editor:
    - Added the Find and Replace functionality for the Data Editor with the ability to find data by matching case, whole word, or using regular expressions.
    - Added support for adding, duplicating, deleting, or setting values to NULL in multiple highlighted rows via the Data Editor context menu.
    - SQL query generation in the Data Editor is now available for columns containing large object data.
    - Improved column drag-and-drop behavior in the Data Editor. Users could drag columns from any area within the header and drop them onto any part of the target column or table body.
  - SQL Editor:
    - Added fuzzy search to SQL Editor auto-completion for object names. The feature allowed users to find tables and containers even with typos or incorrect letter ordering by matching strings that start with, contain, or resemble the input.
    - Fixed data editing for SQL scripts with variables.
  - General:
    - Added a close button to the right tab when it is the only open tab (ex. Scripts). Users no longer needed to use the main menu to close a single tab.
    - Replaced the generic "Something went wrong" message with a specific network error notification when the application cannot connect to the server.
    - Null or empty values can now be assigned to the Driver properties for all drivers.
    - Fixed an issue where re-selecting an existing SSH key file during connection edits caused problems.
    - Fixed the ability to switch tabs in the Data editor using the keyboard.
    - Fixed error notification spelling. Thanks to @Malcolm-B-Breaks.
  - ClickHouse:
    - Updated driver version to 0.9.7.
    - Fixed IP address display in the Data Editor by removing the leading slash.
  - PostgreSQL: Fixed an error when connecting via URL if the database name contains a hyphen.
  - Security:
    - Fixed the high vulnerability (CVE-2025-45141) in the tar library. The library was updated to version 7.5.11.
    - Fixed the high vulnerability (CVE-2026-27148) in the storybook library. The library was updated to version 10.2.10.
    - Fixed the high vulnerability (CVE-2026-27606) in the rollup library. The library was updated to version 4.59.0.
    - Fixed the high vulnerability (CVE-2026-27904) in the minimatch library. The library was updated to version 3.1.3.
    - Fixed the high vulnerability (CVE-2026-27959) in the koa library. The library was updated to version 2.16.4.
    - Fixed the high vulnerability (CVE-2026-32141) in the flatted library. The library was updated to version 4.4.0.

### 26.0.0 2026-03-02

### Changes since 25.3.0:

  - Security:
    - Enforced complete logout and screen data clearance upon session expiration;
    - Fixed the high vulnerability (CVE-2026-25639) in the axios library. The library was updated to version 1.13.5.
  - Administration:
    - Added support for mapping users to CloudBeaver teams based on LDAP memberOf group membership;
    - Change the User list settings in the Administration part to show both active and inactive users by default.
  - SQL Editor:
    - Added support for parameters and variables in queries. This feature allows queries to be reused by changing parameters at execution time. Enabled by default and configurable in personal preferences;
    - Added SQL preview to the Bind parameters/variables dialog to review queries with changed values on the fly;
    - Enabled Tab key for autocompletion in the SQL Editor alongside the Enter key;
    - Added a new setting in the SQL Editor to highlight spaces, tabs, and other whitespace characters to help users read, debug, and maintain their scripts. It is turned off by default and can be configured in personal preferences;
    - Dangerous query confirmation is now shown for all DROP statements, not just for tables.
  - Data Editor:
    - Added ability to automatically generate INSERT, SELECT, DELETE, and UPDATE statements for the selected values;
    - Added undo and redo functionality for cell edits, row operations, and other data modifications. Retains the last 50 actions across the Data Editor, result sets, and related panels;
    - Added "Use local formatting" setting. Users can choose how to display numbers and dates: using the OS locale, a custom locale, or keeping values unformatted. This formatting applies only to displayed values. Data in the database remains unchanged;
    - Added column pinning to keep key columns (e.g., IDs, names) visible while horizontal scrolling through wide tables;
    - Added status indicator icon in the top-left corner with tooltips explaining table editability. Indicates presence of primary keys, read-only connection settings, or read-only columns;
    - Added shortcut Ctrl/Cmd + . to cancel operations in Data Editor;
    - Fixed application freeze in canceling fetch size requests for large tables.
  - Navigator tree:
    - Added the ability to duplicate connection configuration in the project navigation tree. The "Clone connection" feature is available in the context menu;
    - Added the ability for users to configure the Simple or Advanced view in the Navigation tree for all connections or for each connection separately;
    - Added the ability to show table objects, such as columns or keys, in the Navigation tree. The setting is disabled by default and can be turned on in the Navigator settings panel;
    - Added the ability to rename connections via context menu in the Navigation Tree;
    - Added Connection Info tab to display basic information about the current connection for all users.
  - General:
    - Added support for long polling as a fallback when WebSockets are unavailable or blocked. Ensures reliable communication for metadata updates and SQL execution;
    - Extended browser support to versions up to three years old;
    - Redesigned the connection configuration page. Reorganized form fields and sections to provide more input space and reduce visual clutter;
    - Expanded pointer target areas for icons in the Navigator, editors, and tabs according to the accessibility standards;
    - Fixed a keyboard navigation issue for panels to keep the focus inside;
    - Renamed "Database Native" authentication type to "Username/password" in the connection dialog;
    - Fixed issue where the missing pg_dump utility caused errors during initialization or deployment updates when PostgreSQL was selected as the inner database.
  - Databases:
  - ClickHouse:
    - Updated driver to version 0.9.5
    - Added spatial data support
    - Fixed an issue with displaying arrays of UUID, IPv4/IPv6, and Map types
    - Fixed JSON data type reading
    - Resolved an issue with CTE expressions
  - DuckDB:
    - Updated driver to version 1.4.4.0;
    - Added support for the dollar-quoted string syntax for the SQL Editor
  - Oracle: Added a new "Set Username to OS_USER" option in the Misc section of Oracle connection settings. Automatically uses the current database username as the operating system user identifier in session metadata when enabled;
  - PostgreSQL: Added DDL display support for PostgreSQL policies.

[We are happy to reward](https://dbeaver.com/help-dbeaver/) our most active contributors every major sprint.
