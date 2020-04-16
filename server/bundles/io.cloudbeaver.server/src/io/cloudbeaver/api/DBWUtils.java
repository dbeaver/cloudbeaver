/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
package io.cloudbeaver.api;

import graphql.GraphQLContext;
import graphql.schema.DataFetchingEnvironment;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.server.model.session.WebSessionManager;
import io.cloudbeaver.server.model.sql.WebSQLContextInfo;
import io.cloudbeaver.server.model.sql.WebSQLProcessor;

import javax.servlet.http.HttpServletRequest;

/**
 * Web utils
 */
public class DBWUtils {

    public static WebSQLProcessor getSQLProcessor(WebSessionManager sessionManager, DataFetchingEnvironment env) throws DBWebException {
        return sessionManager.getWebSession(getServletRequest(env)).getSQLProcessor(env.getArgument("connectionId"));
    }

    public static WebSQLContextInfo getSQLContext(WebSessionManager sessionManager, DataFetchingEnvironment env) throws DBWebException {
        WebSQLProcessor processor = getSQLProcessor(sessionManager, env);
        String contextId = env.getArgument("contextId");
        WebSQLContextInfo context = processor.getContext(contextId);
        if (context == null) {
            throw new DBWebException("SQL context '" + contextId + "' not found");
        }
        return context;
    }

    public static HttpServletRequest getServletRequest(DataFetchingEnvironment env) {
        GraphQLContext context = env.getContext();
        HttpServletRequest request = context.get("request");
        if (request == null) {
            throw new IllegalStateException("Null request");
        }
        return request;
    }
}
