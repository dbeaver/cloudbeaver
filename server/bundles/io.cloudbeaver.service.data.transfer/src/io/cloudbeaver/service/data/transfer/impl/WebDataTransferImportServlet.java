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

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.WebServiceServletBase;
import io.cloudbeaver.service.data.transfer.DBWServiceDataTransfer;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLProcessor;
import io.cloudbeaver.service.sql.WebSQLResultsInfo;
import io.cloudbeaver.service.sql.WebServiceBindingSQL;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.dbeaver.Log;

import java.io.IOException;
import java.io.InputStream;

@MultipartConfig
public class WebDataTransferImportServlet extends WebServiceServletBase {

    private static final Log log = Log.getLog(WebDataTransferImportServlet.class);

    DBWServiceDataTransfer dbwServiceDataTransfer;


    public WebDataTransferImportServlet(CBApplication application, DBWServiceDataTransfer dbwServiceDataTransfer) {
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

        WebConnectionInfo webConnectionInfo = session.getWebConnectionInfo(request.getParameter("projectId"),
                request.getParameter("connectionId"));
        WebSQLProcessor processor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        WebSQLContextInfo webSQLContextInfo = processor.getContext(request.getParameter("contextId"));

        if (webSQLContextInfo == null) {
            throw new DBWebException("Context is empty");
        }

        WebSQLResultsInfo webSQLResultsInfo = webSQLContextInfo.getResults(request.getParameter("resultId"));
        String processorId = request.getParameter("processorId");
        InputStream file;

        try {
            file = request.getPart("file").getInputStream();
        } catch (ServletException e) {
            throw new DBWebException(e.getMessage());
        }

        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            dbwServiceDataTransfer.asyncImportDataContainer(processorId, file, webSQLResultsInfo, session);
        }
    }
}