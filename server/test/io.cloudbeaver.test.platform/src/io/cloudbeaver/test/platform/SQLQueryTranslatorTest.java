/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
package io.cloudbeaver.test.platform;

import io.cloudbeaver.CloudbeaverMockTest;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.ext.h2.model.H2SQLDialect;
import org.jkiss.dbeaver.ext.mssql.model.SQLServerDialect;
import org.jkiss.dbeaver.ext.mysql.model.MySQLDialect;
import org.jkiss.dbeaver.ext.oracle.model.OracleSQLDialect;
import org.jkiss.dbeaver.ext.postgresql.model.PostgreDialect;
import org.jkiss.dbeaver.model.impl.sql.BasicSQLDialect;
import org.jkiss.dbeaver.model.sql.SQLDialect;
import org.jkiss.dbeaver.model.sql.translate.SQLQueryTranslator;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.junit.Assert;
import org.junit.Test;

import java.util.HashMap;
import java.util.Map;

public class    SQLQueryTranslatorTest extends CloudbeaverMockTest {
    @Test
    public void createSimpleTable() throws DBException {
        var basicSql = "CREATE TABLE CB_AUTH_SUBJECT (SUBJECT_ID VARCHAR(128) NOT NULL," +
            " SUBJECT_TYPE VARCHAR(8) NOT NULL," +
            " IS_SECRET_STORAGE CHAR(1) DEFAULT 'Y' NOT NULL," +
            " PRIMARY KEY (SUBJECT_ID));\n";

        Map<SQLDialect, String> expectedSqlByDialect = new HashMap<>();
        expectedSqlByDialect.put(new H2SQLDialect(), basicSql);
        expectedSqlByDialect.put(
            new PostgreDialect(),
            "CREATE TABLE CB_AUTH_SUBJECT (SUBJECT_ID VARCHAR (128) NOT NULL,\n" +
                "SUBJECT_TYPE VARCHAR (8) NOT NULL,\n" +
                "IS_SECRET_STORAGE CHAR (1) DEFAULT 'Y' NOT NULL,\n" +
                "PRIMARY KEY (SUBJECT_ID));\n"
        );
        expectedSqlByDialect.put(new MySQLDialect(),
            "CREATE TABLE CB_AUTH_SUBJECT (SUBJECT_ID VARCHAR (128) NOT NULL,\n" +
                "SUBJECT_TYPE VARCHAR (8) NOT NULL,\n" +
                "IS_SECRET_STORAGE CHAR (1) DEFAULT 'Y' NOT NULL,\n" +
                "PRIMARY KEY (SUBJECT_ID));\n");
        expectedSqlByDialect.put(new OracleSQLDialect(), basicSql);
        expectedSqlByDialect.put(new SQLServerDialect(), basicSql);

        translateAndValidateQueries(basicSql, expectedSqlByDialect);
    }

    @Test
    public void addColumn() throws DBException {
        var basicSql = "ALTER TABLE CB_AUTH_ATTEMPT ADD ERROR_CODE VARCHAR(128) NULL;\n";
        //same for all dialects
        Map<SQLDialect, String> expectedSqlByDialect = new HashMap<>();
        expectedSqlByDialect.put(new H2SQLDialect(), basicSql);
        expectedSqlByDialect.put(new PostgreDialect(), basicSql);
        expectedSqlByDialect.put(new MySQLDialect(), basicSql);
        expectedSqlByDialect.put(new OracleSQLDialect(), basicSql);
        expectedSqlByDialect.put(new SQLServerDialect(), basicSql);

        translateAndValidateQueries(basicSql, expectedSqlByDialect);
    }

    @Test
    public void alterColumn() throws DBException {
        var basicSql = "ALTER TABLE CB_TABLE ALTER COLUMN CB_COLUMN SET NULL;\n";

        // we use custom scripts for postgres/mysql/oracle
        Map<SQLDialect, String> expectedSqlByDialect = new HashMap<>();
        expectedSqlByDialect.put(new H2SQLDialect(), basicSql);
        expectedSqlByDialect.put(new OracleSQLDialect(), "ALTER TABLE CB_TABLE MODIFY CB_COLUMN NULL;\n");

        translateAndValidateQueries(basicSql, expectedSqlByDialect);
    }

    @Test
    public void createTableWithUuid() throws DBException {
        var basicSql = "CREATE TABLE CB_TEST_TYPES (UUID_COLUMN UUID);\n";

        Map<SQLDialect, String> expectedSqlByDialect = new HashMap<>();
        expectedSqlByDialect.put(new H2SQLDialect(), basicSql);
        expectedSqlByDialect.put(new PostgreDialect(), basicSql);
        expectedSqlByDialect.put(
            new MySQLDialect(),
            "CREATE TABLE CB_TEST_TYPES (UUID_COLUMN CHAR(36));\n"
        );
        expectedSqlByDialect.put(new OracleSQLDialect(), "CREATE TABLE CB_TEST_TYPES (UUID_COLUMN VARCHAR2(36));\n");
        expectedSqlByDialect.put(
            new SQLServerDialect(),
            "CREATE TABLE CB_TEST_TYPES (UUID_COLUMN UNIQUEIDENTIFIER);\n"
        );
        translateAndValidateQueries(basicSql, expectedSqlByDialect);
    }

    @Test
    public void createTableWithBoolean() throws DBException {
        var basicSql = "CREATE TABLE CB_TEST_TYPES (BOOLEAN_COLUMN BOOLEAN);\n";

        Map<SQLDialect, String> expectedSqlByDialect = new HashMap<>();
        expectedSqlByDialect.put(new H2SQLDialect(), basicSql);
        expectedSqlByDialect.put(new PostgreDialect(), basicSql);
        expectedSqlByDialect.put(new MySQLDialect(), "CREATE TABLE CB_TEST_TYPES (BOOLEAN_COLUMN TINYINT(1));\n");

        expectedSqlByDialect.put(
            new OracleSQLDialect(),
            "CREATE TABLE CB_TEST_TYPES (BOOLEAN_COLUMN VARCHAR(1));\n"
        );
        expectedSqlByDialect.put(
            new SQLServerDialect(),
            "CREATE TABLE CB_TEST_TYPES (BOOLEAN_COLUMN BIT);\n"
        );
        translateAndValidateQueries(basicSql, expectedSqlByDialect);
    }

    @Test
    public void createTableWithBlob() throws DBException {
        var basicSql = "CREATE TABLE CB_TEST_TYPES (BLOB_COLUMN BLOB);\n";

        Map<SQLDialect, String> expectedSqlByDialect = new HashMap<>();
        expectedSqlByDialect.put(new H2SQLDialect(), basicSql);
        expectedSqlByDialect.put(new PostgreDialect(), "CREATE TABLE CB_TEST_TYPES (BLOB_COLUMN BYTEA);\n");
        expectedSqlByDialect.put(new MySQLDialect(), basicSql);

        expectedSqlByDialect.put(new OracleSQLDialect(), basicSql);
        expectedSqlByDialect.put(new SQLServerDialect(), "CREATE TABLE CB_TEST_TYPES (BLOB_COLUMN IMAGE);\n");
        translateAndValidateQueries(basicSql, expectedSqlByDialect);
    }

    @Test
    public void createTableWithBigint() throws DBException {
        var basicSql = "CREATE TABLE CB_TEST_TYPES (BIGINT_COLUMN BIGINT);\n";

        Map<SQLDialect, String> expectedSqlByDialect = new HashMap<>();
        expectedSqlByDialect.put(new H2SQLDialect(), basicSql);
        expectedSqlByDialect.put(new PostgreDialect(), basicSql);
        expectedSqlByDialect.put(new MySQLDialect(), basicSql);

        expectedSqlByDialect.put(new OracleSQLDialect(), "CREATE TABLE CB_TEST_TYPES (BIGINT_COLUMN NUMBER);\n");
        expectedSqlByDialect.put(new SQLServerDialect(), basicSql);
        translateAndValidateQueries(basicSql, expectedSqlByDialect);
    }

    @Test
    public void createTableWithAutoincrement() throws DBException {
        var basicSql = "CREATE TABLE CB_TEST_TYPES (AUTOINC_COLUMN BIGINT AUTO_INCREMENT NOT NULL);\n";

        Map<SQLDialect, String> expectedSqlByDialect = new HashMap<>();
        expectedSqlByDialect.put(new H2SQLDialect(), basicSql);
        expectedSqlByDialect.put(new PostgreDialect(), "CREATE SEQUENCE CB_TEST_TYPES_AUTOINC_COLUMN;\n" +
            "CREATE TABLE CB_TEST_TYPES (AUTOINC_COLUMN BIGINT NOT NULL DEFAULT NEXTVAL" +
                "('CB_TEST_TYPES_AUTOINC_COLUMN'));\n" +
            "ALTER SEQUENCE CB_TEST_TYPES_AUTOINC_COLUMN OWNED BY CB_TEST_TYPES.AUTOINC_COLUMN;\n"
        );
        expectedSqlByDialect.put(new MySQLDialect(), basicSql);

        expectedSqlByDialect.put(
            new OracleSQLDialect(),
            "CREATE TABLE CB_TEST_TYPES (AUTOINC_COLUMN NUMBER GENERATED ALWAYS AS IDENTITY NOT NULL);\n");
        expectedSqlByDialect.put(
            new SQLServerDialect(),
            "CREATE TABLE CB_TEST_TYPES (AUTOINC_COLUMN BIGINT IDENTITY NOT NULL);\n");
        translateAndValidateQueries(basicSql, expectedSqlByDialect);

    }

    private static void translateAndValidateQueries(
        @NotNull String basicSql,
        @NotNull Map<SQLDialect, String> expectedSqlByDialect
    ) throws DBException {
        var preferenceStore = DBWorkbench.getPlatform().getPreferenceStore();
        SQLDialect sourceDialect = new BasicSQLDialect() {
        };
        for (Map.Entry<SQLDialect, String> entry : expectedSqlByDialect.entrySet()) {
            String translated = SQLQueryTranslator.translateScript(
                sourceDialect,
                entry.getKey(),
                preferenceStore,
                basicSql
            );
            Assert.assertEquals(
                entry.getKey().getDialectId() + " has invalid syntax " + translated,
                normalizeScript(entry.getValue()),
                normalizeScript(translated)
            );
        }
    }

    private static String normalizeScript(String script) {
        // Unify for tests
        return script.toLowerCase().replace(GeneralUtils.getDefaultLineSeparator(), "\n");
    }

}
