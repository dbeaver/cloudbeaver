/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

public class SqlConsts {
    public static final String fix11MigrationQueries = "" +
        "CREATE TABLE CB_USER_TEAM\n" +
        "(\n" +
        "    USER_ID    VARCHAR(128) NOT NULL,\n" +
        "    TEAM_ID    VARCHAR(128) NOT NULL,\n" +
        "\n" +
        "    GRANT_TIME TIMESTAMP    NOT NULL,\n" +
        "    GRANTED_BY VARCHAR(128) NOT NULL,\n" +
        "\n" +
        "    PRIMARY KEY (USER_ID, TEAM_ID),\n" +
        "    FOREIGN KEY (USER_ID) REFERENCES CB_USER (USER_ID) ON DELETE CASCADE,\n" +
        "    FOREIGN KEY (TEAM_ID) REFERENCES CB_TEAM (TEAM_ID) ON DELETE NO ACTION\n" +
        ");\n" +
        "\n" +
        "INSERT INTO CB_USER_TEAM (USER_ID, TEAM_ID, GRANT_TIME, GRANTED_BY)\n" +
        "SELECT USER_ID, ROLE_ID, GRANT_TIME, GRANTED_BY FROM CB_USER_ROLE;\n" +
        "\n" +
        "CREATE TABLE CB_EXTERNAL_TEAM\n" +
        "(\n" +
        "    TEAM_ID          VARCHAR(128) NOT NULL,\n" +
        "    EXTERNAL_TEAM_ID VARCHAR(128) NOT NULL,\n" +
        "\n" +
        "    PRIMARY KEY (TEAM_ID,EXTERNAL_TEAM_ID),\n" +
        "    FOREIGN KEY (TEAM_ID) REFERENCES CB_TEAM (TEAM_ID) ON DELETE CASCADE\n" +
        ");\n" +
        "\n" +
        "DROP TABLE CB_USER_ROLE;\n" +
        "DROP TABLE CB_ROLE;\n" +
        "\n" +
        "\n" +
        "DELETE FROM CB_SCHEMA_INFO where VERSION > 0;\n" +
        "INSERT INTO CB_SCHEMA_INFO (VERSION,UPDATE_TIME) VALUES(11,CURRENT_TIMESTAMP)\n" +
        "\n";
}
