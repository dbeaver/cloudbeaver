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
package io.cloudbeaver.service.data.transfer.impl;

import com.google.gson.stream.JsonWriter;
import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.BaseWebPlatform;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.WebApplication;
import io.cloudbeaver.service.WebServiceServletBase;
import io.cloudbeaver.service.data.transfer.DBWServiceDataTransfer;
import jakarta.servlet.MultipartConfigElement;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.HttpConstants;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@MultipartConfig
public class WebDataTransferImportServlet extends WebServiceServletBase {

    public static final String ECLIPSE_JETTY_MULTIPART_CONFIG = "org.eclipse.jetty.multipartConfig";
    private static final String PARAM_TASK_ID = "taskId";

    private final DBWServiceDataTransfer dbwServiceDataTransfer;

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
        if (DBWorkbench.isDistributed() && !session.hasPermission(DBWConstants.PERMISSION_SQL_RESULT_UPDATE)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Permission denied");
            return;
        }
        if (!dbwServiceDataTransfer.validateImportPermission(session)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Import is not allowed for this user");
            return;
        }
        if ("POST".equalsIgnoreCase(request.getMethod())) {
            Path tempFolder = WebAppUtils.getWebPlatform().getTempFolder(session.getProgressMonitor(),
                BaseWebPlatform.TEMP_FILE_IMPORT_FOLDER);
            MultipartConfigElement MULTI_PART_CONFIG = new MultipartConfigElement(tempFolder.toString());

            request.setAttribute(ECLIPSE_JETTY_MULTIPART_CONFIG, MULTI_PART_CONFIG);

            Map<String, Object> variables = getVariables(request);
            String taskId = JSONUtils.getString(variables, "taskId");
            if (CommonUtils.isEmpty(taskId)) {
                throw new IllegalArgumentException("Missing required parameter '" + PARAM_TASK_ID + "'");
            }

            String fileName = UUID.randomUUID().toString();
            Path filePath = tempFolder.resolve(fileName);
            try {
                request.getPart("fileData").write(fileName);
            } catch (ServletException e) {
                throw new DBWebException(e.getMessage());
            }

            WebAsyncTaskInfo importTask;
            try {
                importTask = dbwServiceDataTransfer.runImportDataTask(session, taskId, filePath);
            } catch (Exception e) {
                Files.deleteIfExists(filePath);
                throw e;
            }

            response.setContentType(HttpConstants.CONTENT_TYPE_JSON);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id", importTask.getId());
            result.put("name", importTask.getName());
            result.put("running", importTask.isRunning());
            result.put("status", importTask.getStatus());
            result.put("error", importTask.getError());
            result.put("taskResult", importTask.getTaskResult());
            try (JsonWriter writer = new JsonWriter(response.getWriter())) {
                JSONUtils.serializeMap(writer, result);
            }
        }
    }
}
