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

import io.cloudbeaver.service.sql.WebSQLCompletionContext;
import io.cloudbeaver.service.sql.WebServiceBindingSQL;
import io.cloudbeaver.test.platform.CloudbeaverDBTest;
import org.eclipse.jface.text.Document;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.ModelPreferences;
import org.jkiss.dbeaver.model.sql.parser.SQLParserContext;
import org.jkiss.dbeaver.model.sql.parser.SQLScriptParser;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

public class SQLParameterPreferencesTest extends CloudbeaverDBTest {

    @Test
    public void appliesParameterAndVariableChangesToExistingContext() throws Exception {
        var store = webSession.getUserPreferenceStore();
        var userPreferences = store.getCustomUserParameters();
        var savedPreferences = new HashMap<String, Object>();
        savedPreferences.put(ModelPreferences.SQL_PARAMETERS_ENABLED, userPreferences.get(ModelPreferences.SQL_PARAMETERS_ENABLED));
        savedPreferences.put(ModelPreferences.SQL_VARIABLES_ENABLED, userPreferences.get(ModelPreferences.SQL_VARIABLES_ENABLED));
        String parameterQuery = "SELECT :val";
        String variableQuery = "SELECT '${name_var}'";

        try {
            store.updatePreferenceValues(Map.of(
                ModelPreferences.SQL_PARAMETERS_ENABLED, false,
                ModelPreferences.SQL_VARIABLES_ENABLED, false
            ));
            var processor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
            var context = processor.createContext(null, "PUBLIC", globalProject.getId());
            var disabledContext = new WebSQLCompletionContext(context);
            var repeatedContext = new WebSQLCompletionContext(context);

            Assertions.assertSame(disabledContext.getSyntaxManager(), repeatedContext.getSyntaxManager());
            Assertions.assertSame(disabledContext.getRuleManager(), repeatedContext.getRuleManager());
            Assertions.assertEquals(0, countParameters(disabledContext, parameterQuery));
            Assertions.assertEquals(0, countParameters(disabledContext, variableQuery));

            store.updatePreferenceValues(Map.of(
                ModelPreferences.SQL_PARAMETERS_ENABLED, true,
                ModelPreferences.SQL_VARIABLES_ENABLED, true
            ));
            var enabledContext = new WebSQLCompletionContext(context);
            Assertions.assertNotSame(disabledContext.getSyntaxManager(), enabledContext.getSyntaxManager());
            Assertions.assertNotSame(disabledContext.getRuleManager(), enabledContext.getRuleManager());
            Assertions.assertEquals(1, countParameters(enabledContext, parameterQuery));
            Assertions.assertEquals(1, countParameters(enabledContext, variableQuery));
            Assertions.assertEquals(0, countParameters(disabledContext, parameterQuery));

            store.updatePreferenceValues(Map.of(
                ModelPreferences.SQL_PARAMETERS_ENABLED, false,
                ModelPreferences.SQL_VARIABLES_ENABLED, false
            ));
            var updatedContext = new WebSQLCompletionContext(context);
            Assertions.assertEquals(0, countParameters(updatedContext, parameterQuery));
            Assertions.assertEquals(0, countParameters(updatedContext, variableQuery));
        } finally {
            store.updatePreferenceValues(savedPreferences);
        }
    }

    private static int countParameters(@NotNull WebSQLCompletionContext completionContext, @NotNull String query) {
        var parserContext = new SQLParserContext(
            completionContext.getDataSource(),
            completionContext.getSyntaxManager(),
            completionContext.getRuleManager(),
            new Document(query)
        );
        var parameters = SQLScriptParser.parseParametersAndVariables(parserContext, 0, query.length());
        return parameters == null ? 0 : parameters.size();
    }
}
