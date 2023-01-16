/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.cloudbeaver;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Properties;

public class H2ExecutorConsoleApplication {
    private static final String ARG_DB_PATH = "db-path";
    private static final String ARG_DB_USER = "db-user";
    private static final String ARG_DB_PASSWORD = "db-password";
    private static final String ARG_DB_PASSWORD_PATH = "db-password-path";
    private static final String ARG_DB_CUSTOM_QUERY = "db-custom-query";
    private static final String ARG_EXECUTE_11_MIGRATION_FIX = "db-execute-11-migration-fix";

    public static void main(String[] args) throws Exception {
        var parsedArgs = ArgsParser.parseArgs(args);
        var dbPath = validateAndGetValue(ARG_DB_PATH, parsedArgs);
        var dbUser = validateAndGetValue(ARG_DB_USER, parsedArgs);
        String dbPassword = null;
        if (parsedArgs.containsKey(ARG_DB_PASSWORD)) {
            dbPassword = validateAndGetValue(ARG_DB_PASSWORD, parsedArgs);
        } else if (parsedArgs.containsKey(ARG_DB_PASSWORD_PATH)) {
            var dbPasswordFilePath = validateAndGetValue(ARG_DB_PASSWORD_PATH, parsedArgs);
            dbPassword = Files.readString(Path.of(dbPasswordFilePath));
        }

        if (dbPassword == null) {
            throw new RuntimeException("Database password not specified");
        }

        var dbUrl = "jdbc:h2:file:" + dbPath.replaceAll(".mv.db", "");
        var props = new Properties();
        props.put("user", dbUser);
        props.put("password", dbPassword);

        var executor = new H2QueryExecutor(dbUrl, props);
        process(executor, parsedArgs);
    }

    private static String validateAndGetValue(String argName, Map<String, String> ars) {
        String argValue = ars.get(argName);
        if (argValue == null) {
            throw new RuntimeException(argName + " parameter not specified");
        }
        return argValue;
    }

    public static void process(H2QueryExecutor executor, Map<String, String> args) throws Exception {
        if (args.containsKey(ARG_DB_CUSTOM_QUERY)) {
            var customQuery = validateAndGetValue(ARG_DB_CUSTOM_QUERY, args);
            executor.executeQuery(customQuery);
        }

        if (args.containsKey(ARG_EXECUTE_11_MIGRATION_FIX)) {
            System.out.println("Start to execute migration fix");
            executor.execute11MigrationFix();
        }
    }
}