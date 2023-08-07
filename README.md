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

### CloudBeaver 23.1.4 - 2023-08-07

- The SSL option is now available for establishing connections in MySQL and PostgreSQL.
- The filters for the Navigation tree now allow hiding and showing schemas within the interface.
- Access permissions can be specified for pre-configured connections via the configuration file.
- Reverse Proxy authentication now includes the option to provide users' First name and Last name.
- Trino driver has been upgraded to version 3.41.
- Different bug fixes and enhancements have been made.

### CloudBeaver 23.1.3 - 2023-07-24

- Users can simultaneously edit resources, allowing them to work together;
- We have improved the UX in the search bar - users can delete a query or request by clicking on the cross icon;
- The search request considers file names and exclude the .sql file extension for now;
- Different bug fixes and enhancements have been made.

### CloudBeaver 23.1.2 - 2023-07-10

- We have improved the SQL Editor functionality by adding support for displaying tables with nested arrays of objects;
- The ability to compress files during export allows for faster download speeds, particularly for larger files;
- New Settings panel displays the product configuration settings such as Minimum fetch size, Maximum fetch size, and Default fetch size from the Data Editor;
- Different bug fixes and enhancements have been made.

### CloudBeaver 23.1.1 - 2023-06-26

- Connections are consistently displayed now when they are pre-configured into the workspace in the Global Configuration json file.
- Different bug fixes and enhancements have been made.

### CloudBeaver 23.1.0 - 2023-06-05

Changes since 23.0.0

- Data viewer:
  - New grouping panel menu was added in the Data Viewer. This panel extracts unique values from the database column for count. Users can drag and drop the column to the grouping panel and get the results immediately. Sorting, filtering and exporting of the results are available on the Grouping panel. 
- SQL Editor:
  - We improved the performance of the SQL-editor - as a result, handling scripts with up to 10 000 lines does not present any challenges;
  - In the SQL-editor, pressing Tab/Space followed by Enter now causes the cursor to move to a new line;
  - In the SQL editor, when the cursor goes back on the query, the previous hints are displayed;
  - Error when running SQL with semicolon has been fixed.
- Connections:
  - If there is an error in saving the data, the tab for the chosen connection dialog will stay open to allow corrections;
  - The URL-configuration for PostgreSQL now correctly displays only a single database.
- Driver management:
  - The CE version now offers the updated sqlite-jdbc driver, version 3.41.2;
  - CloudBeaver has the option to connect to H2 database version 2;
  - The internal CloudBeaver database is upgraded to the newest H2 version 2 to avoid vulnerability issues. The database will be safely upgraded automatically for the servers with default configurations. You can perform this upgrade manually if you have a custom configuration for this database in your infrastructure.
- Connections:
  - Option to increase the maximum size of text files displayed in the value panel (using the sqlTextPreviewMaxLength parameter) has been added;
  - Support for custom logging configuration has been added. An external configuration file can be used instead of the default configuration.


### Old CloudBeaver releases

You can find information about earlier releases on the CloudBeaver wiki https://github.com/dbeaver/cloudbeaver/wiki/Releases.

