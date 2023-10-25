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
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.navigator.fs.DBNPathBase;
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
import java.util.Map;

public class WebFSServlet extends WebServiceServletBase {
    private final DBWServiceFS fs;

    public WebFSServlet(CBApplication application, DBWServiceFS fs) {
        super(application);
        this.fs = fs;
    }

    @Override
    protected void processServiceRequest(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        Map<String, Object> variables = getVariables(request);
        String nodePath = JSONUtils.getString(variables,"nodePath");
        if (CommonUtils.isEmpty(nodePath)) {
            throw new DBWebException("Node path is not found");
        }
        DBNNode node = session.getNavigatorModel().getNodeByPath(session.getProgressMonitor(), nodePath);
        if (node == null) {
            throw new DBWebException("Navigator node '"  + nodePath + "' is not found");
        }
        if (!(node instanceof DBNPathBase dbnPath)) {
            throw new DBWebException("Invalid navigator node type: "  + node.getClass().getName());
        }
        Path path = dbnPath.getPath();
        if (path == null) {
            throw new DBWebException("Path for node '" + nodePath + "' is not found");
        }
        if (request.getMethod().equals("POST")) {
            try {
                MultipartConfigElement MULTI_PART_CONFIG = new MultipartConfigElement(path.toString());
                request.setAttribute(Request.__MULTIPART_CONFIG_ELEMENT, MULTI_PART_CONFIG);
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
        } else {
            session.addInfoMessage("Download data ...");
            response.setHeader("Content-Type", "application/octet-stream");
            response.setHeader("Content-Disposition", "attachment; filename=\"" + path.getFileName() + "\"");
            response.setHeader("Content-Length", String.valueOf(Files.size(path)));

            try (InputStream is = Files.newInputStream(path)) {
                IOUtils.copyStream(is, response.getOutputStream());
            }
        }

    }
}
