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

### 26.2.0 2026-08-31

### Changes since 26.1.0:

- AI Assistant:
    - Added AI Chat to help users generate and fix queries and explore data more easily. It’s integrated with the SQL Editor to run generated queries instantly. All AI features can be turned off in the Server configuration.
    - Added the ability to use multiple AI configurations for working with the AI chat. Administrators can define tokens, engines and models for OpenAI and Copilot in the Administration panel for each AI profile separately. After that, users can switch between these profiles while using AI features.
    - Added the ability to cancel a response in the AI Chat to stop response generation when needed.
    - The "Endpoint" setting was renamed to "API Base URL" for the OpenAI provider.
    - Added AI engine icons to AI configuration profiles, making it easier to identify AI providers in the Administration panel and AI Chat configuration.
- Administration:
    - Added the database version and the driver version to diagnostic logs.
    - Fixed the issue of fetching groups during LDAP authorization. CloudBeaver now provides all matched groups regardless of fetching errors.
    - Added the Last Login time to the user form and the user table in the administration part.
- Authorization:
    - Added the option to upload files for certificates and keys in the SSL authorization configuration.
    - Fixed an issue causing the application to lose connection to the database after extended uptime. Access is kept automatically during long-running sessions.
- Data Editor:
    - Added the References panel to the Data Editor. The panel displays related records from connected tables. Users can explore table relationships directly.
    - Added the ability to export generated SQL to a .sql file from the Generate SQL dialog.
    - Fixed copying of large JSON values in the Data Editor - now the full value can be copied.
    - Resolved an issue where the Data Editor ignored the text preview's maximum length quota. Increasing this quota now enables the ability to edit large values.
- Data Transfer:
    - Added advanced data import settings, including database-specific replace methods, transaction support, bulk loading, and the option to use a separate connection for data import.
    - Improved memory usage when importing large CSV files to improve the application performance.
- Accessibility:
    - Improved accessibility for the search on the Users section in the Administration panel. The application allows focusing on the search field with the Tab key.
    - Added a loader to the Save button in the Administration panel to improve indication of the long-performing operations.
    - Improved drag-and-drop in the Navigator Tree for objects by enlarging the auto-scroll trigger areas.
    - Added the ability to expand and collapse code block elements, including JSON, using the keyboard in the Data Editor.
    - Fixed shortcuts behavior for AZERTY keyboards. Now shortcuts like Ctrl/Cmd + Z work correctly.
    - Added the ability to use the Enter or space keys to turn checkboxes on/off in the connection properties tab.
- General:
    - Added connection types to visually distinguish database connections using background colors across the Database Navigator and application UI.
    - Improved SQL autocomplete suggestion ordering for object names. Now suggestions are sorted alphabetically.
    - Added a Project Info tab containing the project description to the project context menu.
    - Fixed synchronization between devices. Users see updated connections and folders in other devices without manual refreshes.
- Databases:
    - ClickHouse
        - The driver was updated to version 0.10.0
        - Improved JSON display in the Value panel
        - Added support for the Map data type visualization for the Data Editor
    - The Databend driver was updated to version 0.4.8.
    - LibSQL: Added support for database views.
    - MySQL: Fixed support for comments starting with '#' symbol in the SQL Editor.
    - PostgreSQL
        - Updated the driver to version 42.7.13.
        - Added a Show full DDL option for schemas and tables to generate complete DDL, including objects within a schema and object comments and privileges.
        - Fixed an error that occurred when applying filters to database nodes
        - Fixed generated calls for procedures with OUT parameters
- Security:
    - Removed the ability to rename SQL scripts that start with dots to prevent them from being moved outside the Scripts directory into the root Tree.
    - Added a new "Auto-create users" setting for the reverse proxy provider, allowing new user creation on login. It is enabled by default.
    - Fixed a security flaw allowing unauthorized users to test database connections. The application now requires proper permissions for this action, preventing malicious requests and protecting server files.
    - Fixed a security flaw in the LDAP authentication process. The application validates the username input to prevent unauthorized access and protect directory data.
    - Fixed a cross-site scripting vulnerability caused by unsanitized user input in the web interface.
    - Resolved a security flaw related to user-controlled file paths by adding strict validation to prevent unauthorized resource access.
    - Updated session handling to prevent session fixation vulnerabilities. The application generates new session identifiers upon login.
    - Updated the PostgreSQL JDBC driver to version 42.7.13, including a fix for a high-severity security vulnerability (CVE-2026-54291).
    - Fixed the critical vulnerability (CVE-2026-59873) in the tar library. The library was updated to version 7.5.19.
    - Fixed the critical vulnerability (CVE-2026-9277) in the shell-quote library (updated to version 1.8.4)
    - Fixed the high vulnerability (CVE-2026-10050) in the jetty-security library. The library was updated to version 12.1.11.
    - Fixed the high vulnerability (CVE-2026-14257) in the brace-expansion library. The library was updated to version 5.0.8.
    - Fixed the high vulnerability (GHSA-r28c-9q8g-f849) in the postcss library. The library was updated to version 8.5.18.
    - Fixed the high vulnerability (GHSA-pm4m-ph32-ghv5) in the js-yaml library. The library was updated to version 5.2.2.
    - Fixed the high vulnerability (CVE-2026-59880) in the immutable library. The library was updated to version 5.1.8.
    - Fixed the high vulnerability (CVE-2026-59879) in the fast-uri library. The library was updated to version 3.1.3.
    - Fixed the high vulnerability (CVE-2026-13311) in the shell-quote library. The library was updated to version 1.9.0.
    - Fixed the high vulnerability (GHSA-gcfj-64vw-6mp9) in the axios library. The library was updated to version 1.18.0.
    - Fixed the high vulnerability (CVE-2026-67213) in the nanoid library. The library was updated to version 3.3.17.
    - Fixed the high vulnerability (CVE-2025-71329) in the less library. The library was updated to version 4.7.0.
    - Fixed the high vulnerability (CVE-2026-13697) in the undici library. The library was updated to version 8.9.0.
    - Fixed the high vulnerability (CVE-2026-18446) in the fast-uri library. The library was updated to version 4.1.2.
    - Fixed the high vulnerability (CVE-2026-69152) in the brace-expansion library. The library was updated to version 5.0.9.
    - Fixed the high vulnerability (GHSA-gv7w-rqvm-qjhr) in the esbuild library. The library was updated to version 0.28.1.
    - Fixed the high vulnerability (CVE-2026-12143) in the form-data library. The library was updated to version 4.0.6.
