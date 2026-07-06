<img src="https://github.com/dbeaver/cloudbeaver/wiki/images/cloudbeaver-logo.png" alt="CloudBeaver logo" align="right" width="250"/>

# CloudBeaver Community

Cloud Database Manager - Community Edition.  
CloudBeaver is a web server that provides a rich web interface. The server itself is a Java application, and the web part is written in TypeScript and React.  
It is free to use and open-source (licensed under [Apache 2](https://github.com/dbeaver/cloudbeaver/blob/devel/LICENSE) license).  

<a><img src="https://github.com/dbeaver/cloudbeaver/wiki/images/connection-creation-demo.png" width="400"/></a>
<img src="https://github.com/dbeaver/cloudbeaver/wiki/images/gis-demo.png" width="400"/>
<img src="https://github.com/dbeaver/cloudbeaver/wiki/images/data-transfer-demo.png" width="400"/>
<img src="https://github.com/dbeaver/cloudbeaver/wiki/images/sql-editor-demo.png" width="400"/>

## Documentation
- [GitHub WIKI](https://github.com/dbeaver/cloudbeaver/wiki)
- [Official documentation](https://dbeaver.com/docs/cloudbeaver/)

## Run in Docker

- [Official Docker repository](https://hub.docker.com/r/dbeaver/cloudbeaver)
- [Deployment instructions](https://github.com/dbeaver/cloudbeaver/wiki/CloudBeaver-Deployment)

## Demo server

You can see a live demo of CloudBeaver server here: https://demo.cloudbeaver.io  

[Database access instructions](https://github.com/dbeaver/cloudbeaver/wiki/Demo-Server)

## Changelog

### 26.1.2 2026-07-06

- Data Editor:
    - Added the References panel showing related records from other tables connected by foreign keys. It helps to explore table relationships directly in the Data editor.
    - Resolved an issue where the Data Editor ignored the text preview's maximum length quota. Increasing this quota now enables the ability to edit large values.
- General:
    - Added the Last Login time to the user form and the user table in the administration part.
    - Fixed the bug with the inability to select entered text in the Find and Replace panel in editors.
- Accessibility:
    - Added the ability to use the Enter or Space key to turn checkboxes on/off in the connection properties tab.
- Security:
    - Fixed CVE-2026-55449. Resolved a local file disclosure vulnerability by enforcing strict validation of file identifiers and path containment during data updates.
    - Updated session handling to prevent session fixation vulnerabilities. The application generates new session identifiers upon login.
    - Fixed the high vulnerability (CVE-2026-12151) in the undici library. The library was updated to version 6.27.0.

### 26.1.1 2026-06-22

- General: Added a "Project Info" tab containing the project description to the project context menu.
- Security:
	- Fixed a cross-site scripting vulnerability caused by unsanitized user input in the web interface.
	- Resolved a security flaw related to user-controlled file paths by adding strict validation to prevent unauthorized resource access.
	- Fixed the critical vulnerability (CVE-2026-9277) in the shell-quote library (updated to version 1.8.4).

### 26.1.0 2026-06-01

### Changes since 26.0.0:

- Administration:
    - Added support for custom startup arguments when running CloudBeaver in a container. Administrators can specify configuration file locations to adapt the application to their environment. (thanks to @MalteHei)
    - Updated the manifest.webmanifest file to generate dynamically based on the CLOUDBEAVER_ROOT_URI environment variable. (thanks to @houssemexo26)
- Authorization:
    - Added HTTP header authentication support for GraphQL queries. Users can provide API tokens via Authorization or X-Api-Key headers, allowing external data tools to authenticate without modifying request bodies.
    - Fixed a bug in the authentication form: the existing password is now required for password changes.
- SQL Editor:
    - Updated the SQL Editor to use real tab characters for indentation. The application displayed tabs as four-space gaps with a distinct visual marker.
    - Added an ability to view and edit scripts without connecting to the database.
    - Added the ability to open generated queries right from the Generate SQL window.
    - Added fuzzy search to SQL Editor auto-completion for object names. The feature allows users to find tables and containers even with typos or incorrect letter ordering.
    - Added the tooltip about quoting rules for the Bind variables parameters dialog.
    - Fixed keyword autocompletion for partially typed keywords to avoid redundant letters.
- Data Editor:
    - Added the ability to copy-paste multiple cells at once. Pasted values will be distributed across selected cells.
    - Added an ability to add, duplicate, delete, or set values to NULL in multiple highlighted rows via the Data Editor context menu.
    - Added the Find and Replace functionality for the Data Editor with the ability to find data by matching case, whole word, or using regular expressions.
    - Data Editor started to keep the state of column configurations, such as filters, sorting, and ordering, after the reconnect, page refresh, and re-login.
    - Added key column mark for tables with unique keys in the data grid.
    - Added more settings to the Generated SQL window, including the ability to select fully qualified names for query or use compact SQL formatting.
    - Added a DDL generation option to the Data Editor and Result Set context menu.
    - Fixed copy and paste behavior for multiline and special characters in the Data Editor. Added visual glyphs to indicate line breaks and tabs in the data grid.
    - Fixed the ability to copy Boolean values in the clipboard in the Data Editor.
    - Fixed the ability to calculate row count for non-standard SELECT statements. (thanks to @fdcastel)
- Navigator tree:
    - Reorganized the context menu on the connection level to make it more compact.
    - Added support for special symbols (pipe, comma, and asterisk) for the search field.
    - Removed the "Folders" setting from the settings list for the Navigator Tree.
- Accessibility:
    - Added the Skip to content option for quick keyboard access to the Navigator Tree, editors, and shortcuts list tab to improve application accessibility.
    - Improved keyboard navigation for context menu and buttons for Data Editor, SQL Editor, and Navigator tree.
    - Added the Ctrl + / keyboard shortcut to open the context menu for selected cells in the Data Editor.
    - Fixed the ability to switch tabs in the Data Editor using the keyboard.
    - Fixed contrast for elements across different application parts in the light and dark themes to meet WCAG requirements.
- General:
    - Marked icons for non-saved (temporary) scripts with the hourglass symbol to add visual distinction from the saved ones.
    - Added the ability to set to NULL any value in the Driver Properties.
    - Fixed custom driver properties display for the connection page.
    - Fixed data export in SQL format for values containing single quotes.
- Databases and drivers:
    - ClickHouse:
        - Fixed the display of Array(JSON) types in the data grid.
        - Updated driver version to 0.9.7.
        - Fixed IP address display in the Data Editor by removing the leading slash.
    - Added support for the "prompt=false" connection property for DB2 for IBM i to turn off interactive prompts and prevent related errors.
    - DuckDB:
        - Fixed map rendering for GEOMETRY types with CRS parameters.
        - Fixed geometry type display for database versions > 1.5.
    - H2 database:
        - Added new embedded driver version 2.4.2.
        - Updated server driver to version 2.4.2.
    - Firebird: Expanded database-specific SQL dialect coverage for the SQL Editor. Added more keywords, built-in functions, and SQL generators.
    - MySQL: Fixed query boundaries recognition in the SQL Editor for scripts with the DELIMITER keyword.
    - PostgreSQL:
        - Updated driver to version 42.7.11
        - Fixed missing INOUT parameters in CHECK generation for procedures and functions.
        - Fixed handling of 24:xx values in time columns.
        - Fixed an error when connecting via URL if the database name contains a hyphen.
    - SQL Server:
        - Fixed DDL generation for external tables.
        - Fixed the database connectivity issue after the Java update.
- Security:
    - Added an administrative setting to restrict SSH tunneling capabilities. Administrators can now limit tunnel configuration to authorized users, reducing the risk of unauthorized network access.
    - Fixed the critical vulnerability (CVE-2025-62718) in the axios library. The library was updated to version 1.15.0.
    - Fixed the high vulnerability (CVE-2026-4800) in the lodash library. The library was updated to version 4.18.0.
    - Fixed the high vulnerability (CVE-2026-39363) in the vite library. The library was updated to version 7.3.2.
    - Fixed the high vulnerability (CVE-2026-42035) in the axios library. The library was updated to version 1.15.1.
    - Fixed the high vulnerability (CVE-2026-3505) in the bcpg-jdk18on library. The library was updated to version 1.84.0.
    - Fixed the high vulnerability (CVE-2026-33671) in the picomatch library. The library was updated to version 2.3.2.
    - Fixed the high vulnerability (CVE-2026-33943) in the happy-dom library. The library was updated to version 20.8.8.
    - Fixed the high vulnerability (CVE-2025-45141) in the tar library. The library was updated to version 7.5.11.
    - Fixed the high vulnerability (CVE-2026-27148) in the storybook library. The library was updated to version 10.2.10.
    - Fixed the high vulnerability (CVE-2026-27606) in the rollup library. The library was updated to version 4.59.0.
    - Fixed the high vulnerability (CVE-2026-27904) in the minimatch library. The library was updated to version 3.1.3.
    - Fixed the high vulnerability (CVE-2026-27959) in the koa library. The library was updated to version 2.16.4.
    - Fixed the high vulnerability (CVE-2026-32141) in the flatted library. The library was updated to version 4.4.0.
    - Fixed the medium vulnerability (CVE-2026-41305) in the postcss library. The library was updated to version 8.5.14.
