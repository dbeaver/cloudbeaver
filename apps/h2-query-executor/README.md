# H2 Query Executor

Applications for executing h2 database queries through the console and running queries to fix the CloudBeaver database

## How to build

Use mvn clean install to build executable jar.

## Arguments:

**--db-path** - path to cloudbeaver database

**--db-user** - cloudbeaver database username

**--db-password-path** - path to .database.credentials.dat

**--db-password** - database password(use only password or db-password-path, not both)

**--db-custom-query** - execute custom sql query

**--db-execute-11-migration-fix** - mark that scripts to fix broken migration must be executed

## Example:

java -jar h2-query-executor-1.0.0.jar --db-path=/var/cloudbeaver/workspace/.data/cb.h2.dat.mv.db --db-user=cb-data
--db-password-path=/var/cloudbeaver/workspace/.data/.database-credentials.dat --db-custom-query="show tables"

