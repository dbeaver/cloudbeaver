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
package io.cloudbeaver.service.sql;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.WebServiceServletBase;
import jakarta.servlet.MultipartConfigElement;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.eclipse.jetty.server.Request;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@MultipartConfig
public class WebSQLFileLoaderServlet extends WebServiceServletBase {

    private static final Log log = Log.getLog(WebSQLFileLoaderServlet.class);

    private static final Type MAP_STRING_OBJECT_TYPE = new TypeToken<Map<String, Object>>() {
    }.getType();
    private static final String REQUEST_PARAM_VARIABLES = "variables";

    private static final String TEMP_FILE_FOLDER = "temp-sql-upload-files";

    private static final String FILE_ID = "fileId";

    private static final String FORBIDDEN_CHARACTERS_FILE_REGEX = "(?U)[$()@ /]+";

    private static final Gson gson = new GsonBuilder()
            .serializeNulls()
            .setPrettyPrinting()
            .create();

    public WebSQLFileLoaderServlet(CBApplication application) {
        super(application);
    }

    @Override
    protected void processServiceRequest(
            WebSession session,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws DBException, IOException {
        if (!session.isAuthorizedInSecurityManager()) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Update for users only");
            return;
        }

        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return;
        }

        Path tempFolder = CBPlatform.getInstance()
                .getTempFolder(session.getProgressMonitor(), TEMP_FILE_FOLDER)
                .resolve(session.getSessionId());

        MultipartConfigElement multiPartConfig = new MultipartConfigElement(tempFolder.toString());
        request.setAttribute(Request.__MULTIPART_CONFIG_ELEMENT, multiPartConfig);

        Map<String, Object> variables = gson.fromJson(request.getParameter(REQUEST_PARAM_VARIABLES), MAP_STRING_OBJECT_TYPE);

        String fileId = JSONUtils.getString(variables, FILE_ID);

        if (fileId != null && !fileId.matches(FORBIDDEN_CHARACTERS_FILE_REGEX) && !fileId.startsWith(".")) {
            Path file = tempFolder.resolve(fileId);
            try {
                Files.write(file, request.getPart("fileData").getInputStream().readAllBytes());
            } catch (ServletException e) {
                log.error(e.getMessage());
                throw new DBWebException(e.getMessage());
            }
        } else {
            String illegalCharacters = fileId != null ?
                fileId.replaceAll(FORBIDDEN_CHARACTERS_FILE_REGEX, " ").strip() : null;
            throw new DBException("Resource path '" + fileId + "' contains illegal characters: " + illegalCharacters);
        }
    }
}