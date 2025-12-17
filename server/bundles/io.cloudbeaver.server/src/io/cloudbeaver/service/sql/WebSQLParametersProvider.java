/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.service.sql;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.sql.messages.WebSQLMessages;
import io.cloudbeaver.websocket.event.task.WSSessionTaskQueryParamsConfirmationEvent;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.DBDDataReceiver;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.sql.SQLParametersProviderBase;
import org.jkiss.dbeaver.model.sql.SQLQuery;
import org.jkiss.dbeaver.model.sql.SQLQueryParameter;
import org.jkiss.dbeaver.model.sql.SQLScriptContext;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.function.Supplier;

public class WebSQLParametersProvider extends SQLParametersProviderBase {
    private static final Log log = Log.getLog(WebSQLParametersProvider.class);
    @NotNull
    private final WebSession webSession;
    @NotNull
    private final WebAsyncTaskInfo taskInfo;

    public WebSQLParametersProvider(@NotNull WebSession webSession, @NotNull WebAsyncTaskInfo taskInfo) {
        this.webSession = webSession;
        this.taskInfo = taskInfo;
    }

    @Nullable
    @Override
    protected Boolean collectAndAssignVariables(
        @NotNull SQLScriptContext scriptContext,
        @NotNull SQLQuery sqlStatement,
        @NotNull List<SQLQueryParameter> parameters,
        @NotNull Supplier<DBDDataReceiver> dataReceiverSupplier
    ) {
        Map<String, Object> unsetParams = new LinkedHashMap<>();
        for (SQLQueryParameter param : parameters) {
            if (!param.isVariableSet()) {
                // Empty value for now, maybe in future we can set some defaults here
                unsetParams.put(param.getName(), "");
            }
        }
        if (unsetParams.isEmpty()) {
            return true;
        }

        CompletableFuture<Map<String, Object>> completableFuture = new CompletableFuture<>();
        WSEvent event = new WSSessionTaskQueryParamsConfirmationEvent(
            taskInfo.getId(),
            WebSQLMessages.model_web_dialog_sql_param_title,
            "",
            sqlStatement.getText(),
            unsetParams
        );
        try {
            Map<String, Object> response = WebSQLUtils.requestConfirmation(webSession, taskInfo, event, completableFuture);
            // Save values back to script context
            for (SQLQueryParameter param : parameters) {
                if (response != null && response.containsKey(param.getName())) {
                    String strValue = JSONUtils.getString(response, param.getName());
                    param.setValue(strValue);
                    param.setVariableSet(true);
                    scriptContext.setVariable(param.getName(), strValue);
                }
            }
            return true;

        } catch (DBWebException e) {
            log.error("Error getting SQL parameter values: " + e.getMessage(), e);
            return false;
        }
    }
}
