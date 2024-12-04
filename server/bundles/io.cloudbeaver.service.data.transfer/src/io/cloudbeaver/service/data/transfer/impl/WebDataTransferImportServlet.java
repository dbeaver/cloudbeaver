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
package io.cloudbeaver.service.data.transfer.impl;

import com.google.gson.stream.JsonWriter;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.BaseWebPlatform;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.WebApplication;
import io.cloudbeaver.service.WebServiceServletBase;
import io.cloudbeaver.service.data.transfer.DBWServiceDataTransfer;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLProcessor;
import io.cloudbeaver.service.sql.WebSQLResultsInfo;
import io.cloudbeaver.service.sql.WebServiceBindingSQL;
import jakarta.servlet.MultipartConfigElement;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@MultipartConfig
public class WebDataTransferImportServlet extends WebServiceServletBase {

    private static final Log log = Log.getLog(WebDataTransferImportServlet.class);
    public static final String ECLIPSE_JETTY_MULTIPART_CONFIG = "org.eclipse.jetty.multipartConfig";

    DBWServiceDataTransfer dbwServiceDataTransfer;


    public WebDataTransferImportServlet(WebApplication application, DBWServiceDataTransfer dbwServiceDataTransfer) {
        super(application);
        this.dbwServiceDataTransfer = dbwServiceDataTransfer;
    }

    @Override
    protected void processServiceRequest(
            WebSession session,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException, DBWebException {
        if (!session.isAuthorizedInSecurityManager()) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Import for users only");
            return;
        }
        if ("POST".equalsIgnoreCase(request.getMethod())) {
            Path tempFolder = WebAppUtils.getWebPlatform().getTempFolder(session.getProgressMonitor(),
                BaseWebPlatform.TEMP_FILE_IMPORT_FOLDER);
            MultipartConfigElement MULTI_PART_CONFIG = new MultipartConfigElement(tempFolder.toString());

            request.setAttribute(ECLIPSE_JETTY_MULTIPART_CONFIG, MULTI_PART_CONFIG);

            Map<String, Object> variables = getVariables(request);

            String projectId = JSONUtils.getString(variables, "projectId");
            String connectionId = JSONUtils.getString(variables, "connectionId");
            String contextId = JSONUtils.getString(variables, "contextId");
            String resultId = JSONUtils.getString(variables, "resultsId");
            String processorId = JSONUtils.getString(variables, "processorId");

            if (projectId == null || connectionId == null || contextId == null || resultId == null || processorId == null) {
                throw new IllegalArgumentException("Missing required parameters");
            }

            WebConnectionInfo webConnectionInfo = session.getAccessibleProjectById(projectId).getWebConnectionInfo(connectionId);
            WebSQLProcessor processor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
            WebSQLContextInfo webSQLContextInfo = processor.getContext(contextId);

            if (webSQLContextInfo == null) {
                throw new DBWebException("Context is empty");
            }

            WebSQLResultsInfo webSQLResultsInfo = webSQLContextInfo.getResults(resultId);
            Path filePath;

            try {
                InputStream file = request.getPart("fileData").getInputStream();
                filePath = tempFolder.resolve(UUID.randomUUID().toString());
                Files.write(filePath, file.readAllBytes());
            } catch (ServletException e) {
                throw new DBWebException(e.getMessage());
            }

            WebAsyncTaskInfo asyncImportDataContainer =
                    dbwServiceDataTransfer.asyncImportDataContainer(processorId, filePath, webSQLResultsInfo, session);
            response.setContentType(CBConstants.APPLICATION_JSON);
            Map<String, Object> parameters = new LinkedHashMap<>();
            parameters.put("id", asyncImportDataContainer.getId());
            parameters.put("name", asyncImportDataContainer.getName());
            parameters.put("running", asyncImportDataContainer.isRunning());
            parameters.put("status", asyncImportDataContainer.getStatus());
            parameters.put("error", asyncImportDataContainer.getError());
            parameters.put("taskResult", asyncImportDataContainer.getTaskResult());
            try (JsonWriter writer = new JsonWriter(response.getWriter())) {
                JSONUtils.serializeMap(writer, parameters);
            }
        }
    }
}