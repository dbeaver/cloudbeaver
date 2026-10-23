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
package io.cloudbeaver.test.platform.sql;

import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLProcessor;
import io.cloudbeaver.service.sql.WebServiceBindingSQL;
import io.cloudbeaver.test.platform.CloudbeaverDBTest;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.ModelPreferences;
import org.jkiss.dbeaver.ModelPreferences.SQLScriptStatementDelimiterMode;
import org.jkiss.dbeaver.model.exec.jdbc.JDBCResultSet;
import org.jkiss.dbeaver.model.exec.jdbc.JDBCStatement;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

public class BlankLineDelimiterTest extends CloudbeaverDBTest {

    @Test
    public void appliesChangedDelimiterModeToExistingProcessor() throws Exception {
        Map<String, Object> userPreferences = webSession.getUserPreferenceStore().getCustomUserParameters();
        boolean hadDelimiterMode = userPreferences.containsKey(ModelPreferences.SCRIPT_STATEMENT_DELIMITER_BLANK);
        Object previousDelimiterMode = userPreferences.get(ModelPreferences.SCRIPT_STATEMENT_DELIMITER_BLANK);

        try {
            try (JDBCStatement statement = databaseSession.createStatement()) {
                statement.execute("CREATE TABLE BLANK_LINE_DELIMITER_TEST (id INTEGER PRIMARY KEY)");
                statement.execute("INSERT INTO BLANK_LINE_DELIMITER_TEST (id) VALUES (1), (2)");
            }

            setDelimiterMode(SQLScriptStatementDelimiterMode.BLANK_LINE_AND_SEPARATOR);
            WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
            WebSQLContextInfo sqlContext = sqlProcessor.createContext(null, "PUBLIC", globalProject.getId());

            setDelimiterMode(SQLScriptStatementDelimiterMode.ONLY_SEPARATOR);
            String taskId = clientWrapper.asyncSqlExecute(
                globalProject,
                sqlContext,
                databaseContainer.getId(),
                "DELETE FROM BLANK_LINE_DELIMITER_TEST\nWHERE id > 0\n\nAND id = 1"
            );
            clientWrapper.waitTaskCompleted(taskId);

            try (JDBCStatement statement = databaseSession.createStatement();
                 JDBCResultSet resultSet = statement.executeQuery("SELECT id FROM BLANK_LINE_DELIMITER_TEST")) {
                Assertions.assertTrue(resultSet.next());
                Assertions.assertEquals(2, resultSet.getInt(1));
                Assertions.assertFalse(resultSet.next());
            }
        } finally {
            Map<String, Object> preferences = new HashMap<>();
            preferences.put(
                ModelPreferences.SCRIPT_STATEMENT_DELIMITER_BLANK,
                hadDelimiterMode ? previousDelimiterMode : null
            );
            webSession.getUserPreferenceStore().updatePreferenceValues(preferences);
        }
    }

    private void setDelimiterMode(@NotNull SQLScriptStatementDelimiterMode mode) throws DBException {
        webSession.getUserPreferenceStore().updatePreferenceValues(Map.of(
            ModelPreferences.SCRIPT_STATEMENT_DELIMITER_BLANK,
            mode.getName()
        ));
    }
}
