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
package io.cloudbeaver.service.sql;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.WebServiceServletBase;
import org.eclipse.jetty.server.Request;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.utils.CommonUtils;

import javax.servlet.MultipartConfigElement;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.file.Path;
import java.util.AbstractMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@MultipartConfig
public class WebSQLFileLoaderServlet extends WebServiceServletBase {

    private static final Log log = Log.getLog(WebSQLFileLoaderServlet.class);

    private static final Type MAP_STRING_OBJECT_TYPE = new TypeToken<Map<String, Object>>() {
    }.getType();
    private static final String REQUEST_PARAM_VARIABLES = "variables";

    private static final Gson gson = new GsonBuilder()
        .serializeNulls()
        .setPrettyPrinting()
        .create();

    private final DBWServiceSQL dbwServiceSQL;

    public WebSQLFileLoaderServlet(CBApplication application,
                                   DBWServiceSQL dbwServiceSQL) {
        super(application);
        this.dbwServiceSQL = dbwServiceSQL;
    }

    @Override
    protected void processServiceRequest(
        WebSession session,
        HttpServletRequest request,
        HttpServletResponse response
    ) throws DBException, IOException {
        if (!session.hasPermission(DBWConstants.PERMISSION_ADMIN)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Driver management accessible for admins only");
            return;
        }

        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return;
        }

        Path tempFolder = CBPlatform.getInstance().getTempFolder(session.getProgressMonitor(), "temp-sql-upload-files");
        MultipartConfigElement multiPartConfig = new MultipartConfigElement(tempFolder.toString());
        request.setAttribute(Request.__MULTIPART_CONFIG_ELEMENT, multiPartConfig);

        Map<String, Object> variables = gson.fromJson(request.getParameter(REQUEST_PARAM_VARIABLES), MAP_STRING_OBJECT_TYPE);

        String projectId = JSONUtils.getString(variables, "projectId");
        String connectionId = JSONUtils.getString(variables, "connectionId");
        String contextId = JSONUtils.getString(variables, "contextId");
        String resultsId = JSONUtils.getString(variables, "resultsId");
        String data = JSONUtils.getString(variables, "data");
        Integer index = JSONUtils.getInteger(variables, "index");

        if (projectId == null || connectionId == null || contextId == null || resultsId == null || data == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing required parameters");
            return;
        }

        WebSQLContextInfo webSQLContextInfo = WebServiceBindingSQL.getSQLContext(
            WebServiceBindingSQL.getSQLProcessor(WebServiceBindingBase.getWebConnection(session, projectId, connectionId)), contextId);

        try {
            Map<String, Object> updateValuesMap = request.getParts().stream()
                .filter(p -> !CommonUtils.isEmpty(p.getSubmittedFileName()))
                .map(p -> {
                    try {
                        return new AbstractMap.SimpleEntry<>(String.valueOf(index), p.getInputStream());
                    } catch (IOException e) {
                        log.error("Error reading file contents", e);
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

            variables.put("updateValues", updateValuesMap);

            WebSQLResultsRow webSQLResultsRow = new WebSQLResultsRow(variables);

            dbwServiceSQL.writeLobValue(webSQLContextInfo, resultsId, List.of(webSQLResultsRow));

        } catch (Exception e) {
            log.error("Error processing file upload request", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error processing file upload");
        }
    }
}