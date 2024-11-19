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
package io.cloudbeaver.service.fs.model;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.fs.FSUtils;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.WebServiceServletBase;
import io.cloudbeaver.service.fs.DBWServiceFS;
import jakarta.servlet.MultipartConfigElement;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import org.eclipse.jetty.ee10.servlet.ServletContextRequest;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.navigator.fs.DBNPathBase;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@MultipartConfig()
public class WebFSServlet extends WebServiceServletBase {
    private static final String PARAM_PROJECT_ID = "projectId";
    private final DBWServiceFS fs;

    public WebFSServlet(CBApplication application, DBWServiceFS fs) {
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
            doPost(session, request, response);
        } else {
            doGet(session, request, response);
        }

    }

    private void doGet(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        Path path = FSUtils.getPathFromNode(session, request.getParameter("nodePath"));
        session.addInfoMessage("Download data ...");
        response.setHeader("Content-Type", "application/octet-stream");
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
        DBNPathBase node = FSUtils.getNodeByPath(session, parentNodePath);
        Path path = node.getPath();
        try {
            for (Part part : request.getParts()) {
                String fileName = part.getSubmittedFileName();
                if (CommonUtils.isEmpty(fileName)) {
                    continue;
                }
                try (InputStream is = part.getInputStream()) {
                    Files.copy(is, path.resolve(fileName));
                    node.addChildResource(path.resolve(fileName));
                }
            }
        } catch (Exception e) {
            throw new DBWebException("File Upload Failed: Unable to Save File to the File System",
                CommonUtils.getRootCause(e));
        }
    }
}
