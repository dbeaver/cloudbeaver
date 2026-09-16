/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
package io.cloudbeaver.test.platform.postgresql;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

public class PostgreSQLDdlIntegrationTest extends CloudbeaverMockTest {
    private final WebGQLClient client = CEAppStarter.createClient();
    private PostgreSQLDataSourceTestFixture fixture;

    @BeforeEach
    public void setUpPostgreSQL() throws Exception {
        fixture = PostgreSQLDataSourceTestFixture.setUp(client);
    }

    @AfterEach
    public void tearDownPostgreSQL() throws Exception {
        if (fixture != null) {
            fixture.close();
        }
    }

    @Test
    public void fullDdlIsGeneratedAsynchronouslyWithCommentsAndPermissions() throws Exception {
        Map<String, Object> parentTable = findTable("parent_table");
        Map<String, Object> tableObject = JSONUtils.getObject(parentTable, "object");
        Assertions.assertTrue(
            JSONUtils.getStringList(tableObject, "features").contains("supportsFullDdl")
        );
        String qualifiedTableName = fixture.getSchemaName() + ".parent_table";

        String regularDdl = fixture.generateEntityDdl(nodePath(parentTable), false);
        Assertions.assertTrue(regularDdl.contains("CREATE TABLE " + qualifiedTableName), regularDdl);
        Assertions.assertFalse(regularDdl.contains("ALTER TABLE " + qualifiedTableName + " OWNER TO "), regularDdl);
        Assertions.assertFalse(regularDdl.contains("GRANT SELECT ON TABLE " + qualifiedTableName), regularDdl);

        String fullDdl = fixture.generateEntityDdl(nodePath(parentTable), true);
        Assertions.assertTrue(fullDdl.contains(
            "COMMENT ON TABLE " + qualifiedTableName + " IS 'PostgreSQL full DDL table'"
        ), fullDdl);
        Assertions.assertTrue(fullDdl.contains(
            "COMMENT ON COLUMN " + qualifiedTableName + ".note IS 'Optional parent note'"
        ), fullDdl);
        Assertions.assertTrue(fullDdl.contains(
            "ALTER TABLE " + qualifiedTableName + " OWNER TO " + fixture.getConfig().user()
        ), fullDdl);
        Assertions.assertTrue(fullDdl.contains("GRANT SELECT ON TABLE " + qualifiedTableName + " TO public"), fullDdl);
    }

    @NotNull
    private Map<String, Object> findTable(@NotNull String tableName) throws Exception {
        Map<String, Object> node = findChild(
            fixture.getNavigatorChildren(fixture.getConnectionNodePath()),
            "Databases"
        );
        node = findChild(fixture.getNavigatorChildren(nodePath(node)), fixture.getConfig().database());
        node = findChild(fixture.getNavigatorChildren(nodePath(node)), "Schemas");
        node = findChild(fixture.getNavigatorChildren(nodePath(node)), fixture.getSchemaName());
        node = findChild(fixture.getNavigatorChildren(nodePath(node)), "Tables");
        return findChild(fixture.getNavigatorChildren(nodePath(node)), tableName);
    }

    @NotNull
    private static Map<String, Object> findChild(
        @NotNull List<Map<String, Object>> children,
        @NotNull String name
    ) {
        return children.stream()
            .filter(child -> name.equals(JSONUtils.getString(child, "name")))
            .findFirst()
            .orElseThrow(() -> new AssertionError("Navigator child not found: " + name));
    }

    @NotNull
    private static String nodePath(@NotNull Map<String, Object> node) {
        return JSONUtils.getString(node, "uri");
    }
}
