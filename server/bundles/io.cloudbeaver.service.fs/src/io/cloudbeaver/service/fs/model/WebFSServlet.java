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
package io.cloudbeaver.service.fs.model;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.WebServiceServletBase;
import io.cloudbeaver.service.fs.DBWServiceFS;
import org.eclipse.jetty.server.Request;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import javax.servlet.MultipartConfigElement;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

public class WebFSServlet extends WebServiceServletBase {
    private static final String PARAM_PROJECT_ID = "projectId";
    private final DBWServiceFS fs;

    public WebFSServlet(CBApplication application, DBWServiceFS fs) {
        super(application);
        this.fs = fs;
    }

    @Override
    protected void processServiceRequest(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        if (request.getMethod().equals("POST")) {
            doPost(session, request, response);
        } else {
            doGet(session, request, response);
        }

    }

    private void doGet(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        Path path = getPath(session, request.getParameter(PARAM_PROJECT_ID), request.getParameter("fileURI"));
        session.addInfoMessage("Download data ...");
        response.setHeader("Content-Type", "application/octet-stream");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + path.getFileName() + "\"");
        response.setHeader("Content-Length", String.valueOf(Files.size(path)));

        try (InputStream is = Files.newInputStream(path)) {
            IOUtils.copyStream(is, response.getOutputStream());
        }
    }

    private void doPost(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException {
        // Hack for getting request params
        request.setAttribute(Request.__MULTIPART_CONFIG_ELEMENT, new MultipartConfigElement(""));
        String projectId = JSONUtils.getString(getVariables(request), PARAM_PROJECT_ID);
        String uri = JSONUtils.getString(getVariables(request), "parentURI");
        Path path = getPath(session, projectId, uri);
        // set the final location of parent folder
        request.setAttribute(Request.__MULTIPART_CONFIG_ELEMENT, new MultipartConfigElement(path.toString()));
        try {
            for (Part part : request.getParts()) {
                String fileName = part.getSubmittedFileName();
                if (CommonUtils.isEmpty(fileName)) {
                    continue;
                }
                try (InputStream is = part.getInputStream()) {
                    Files.copy(is, path.resolve(fileName));
                }
            }
        } catch (Exception e) {
            throw new DBWebException("Servlet exception ", e);
        }
    }

    @NotNull
    private Path getPath(WebSession session, String projectId, String uri) throws DBException {
        if (CommonUtils.isEmpty(projectId)) {
            throw new DBWebException("Project ID is not found");
        }
        if (CommonUtils.isEmpty(uri)) {
            throw new DBWebException("URI is not found");
        }
        return session.getFileSystemManager(projectId).getPathFromString(session.getProgressMonitor(), uri);
    }
}
