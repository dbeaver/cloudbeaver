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
package io.cloudbeaver.service.fs.model;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.fs.WebFSUtils;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.WebServiceServletBase;
import io.cloudbeaver.service.fs.DBWServiceFS;
import jakarta.servlet.MultipartConfigElement;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import org.eclipse.jetty.ee11.servlet.ServletContextRequest;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.navigator.fs.DBNPathBase;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.HttpConstants;
import org.jkiss.utils.IOUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.Map;

@MultipartConfig()
public class WebFSServlet extends WebServiceServletBase {

    private static final Log log = Log.getLog(WebFSServlet.class);
    private static final String PARAM_PROJECT_ID = "projectId";
    private final DBWServiceFS fs;

    public WebFSServlet(CBApplication<?> application, DBWServiceFS fs) {
        super(application);
        this.fs = fs;
    }

    @Override
    protected void processServiceRequest(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        if (!session.isAuthorizedInSecurityManager()) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Anonymous access restricted.");
            return;
        }
        if (request.getMethod().equals("POST")) {
            if (DBWorkbench.isDistributed() && !session.hasPermission(DBWConstants.PERMISSION_SQL_RESULT_UPDATE)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Permission denied.");
                return;
            }
            doPost(session, request, response);
        } else {
            doGet(session, request, response);
        }

    }

    private void doGet(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        Path path = WebFSUtils.getPathFromNode(session, request.getParameter("nodePath"));
        session.addInfoMessage("Download data ...");
        response.setHeader(HttpConstants.HEADER_CONTENT_TYPE, "application/octet-stream");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + path.getFileName() + "\"");
        response.setHeader("Content-Length", String.valueOf(Files.size(path)));

        try (InputStream is = Files.newInputStream(path)) {
            IOUtils.copyStream(is, response.getOutputStream());
        }
    }

    private void doPost(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        // we need to set this attribute to get parts
        request.setAttribute(ServletContextRequest.MULTIPART_CONFIG_ELEMENT, new MultipartConfigElement(""));
        Map<String, Object> variables = getVariables(request);
        String parentNodePath = JSONUtils.getString(variables, "toParentNodePath");
        if (CommonUtils.isEmpty(parentNodePath)) {
            throw new DBException("Parent node path parameter is not found");
        }
        DBNPathBase node = WebFSUtils.getNodeByPath(session, parentNodePath);
        Path path = node.getPath();
        try {
            for (Part part : request.getParts()) {
                String fileName = part.getSubmittedFileName();
                if (CommonUtils.isEmpty(fileName)) {
                    continue;
                }
                Path safeTarget = resolveSafeChild(path, fileName);
                try (InputStream is = part.getInputStream()) {
                    Files.copy(is, safeTarget);
                    node.addChildResource(safeTarget);
                }
            }
        } catch (Exception e) {
            throw new DBWebException("File Upload Failed: Unable to Save File to the File System",
                CommonUtils.getRootCause(e));
        }
    }

    @NotNull
    private Path resolveSafeChild(@NotNull Path parent, @NotNull String submittedFileName) throws DBException {
        Path candidate;
        try {
            candidate = Path.of(submittedFileName);
        } catch (InvalidPathException e) {
            throw new DBException("Invalid file name");
        }
        Path baseName = candidate.getFileName();
        if (baseName == null || baseName.toString().isBlank()) {
            throw new DBException("Invalid file name");
        }
        if (submittedFileName.isBlank()
            || ".".equals(submittedFileName)
            || "..".equals(submittedFileName)
            || submittedFileName.indexOf('/') >= 0
            || submittedFileName.indexOf('\\') >= 0
        ) {
            throw new DBException("Invalid file name");
        }
        try {
            return parent.normalize().resolve(submittedFileName).normalize();
        } catch (InvalidPathException e) {
            throw new DBException("Invalid file name");
        }
    }

    @Override
    protected Map<String, Object> getVariables(HttpServletRequest request) {
        Map<String, Object> variables = super.getVariables(request);
        if (request.getMethod().equals("POST")) {
            try {
                for (Part part : request.getParts()) {
                    if (part.getSubmittedFileName() != null && !part.getSubmittedFileName().isEmpty()) {
                        variables.put("fileName", part.getSubmittedFileName());
                        break;
                    }
                }
            } catch (Exception e) {
                log.debug("Failed to get fileName from request for logging", e);
            }
        }
        return variables;
    }
}
