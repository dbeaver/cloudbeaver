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
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.WebApplication;
import io.cloudbeaver.service.WebServiceServletBase;
import io.cloudbeaver.service.data.transfer.DBWServiceDataTransfer;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferProcessorDescriptor;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferRegistry;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;

public class WebDataTransferServlet extends WebServiceServletBase {

    private static final Log log = Log.getLog(WebDataTransferServlet.class);

    private final DBWServiceDataTransfer dtManager;

    public WebDataTransferServlet(WebApplication application, DBWServiceDataTransfer dtManager) {
        super(application);
        this.dtManager = dtManager;
    }

    @Override
    protected void processServiceRequest(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        String dataFileId = request.getPathInfo();
        if (CommonUtils.isEmpty(dataFileId)) {
            throw new DBWebException("Data ID not specified");
        }
        while (dataFileId.startsWith("/")) {
            dataFileId = dataFileId.substring(1);
        }

        WebDataTransferSessionConfig dtConfig = WebDataTransferUtils.getSessionDataTransferConfig(session);
        WebDataTransferTaskConfig taskInfo = dtConfig.getTask(dataFileId);
        if (taskInfo == null) {
            throw new DBWebException("Session task '" + dataFileId + "' not found");
        }
        DataTransferProcessorDescriptor processor = DataTransferRegistry.getInstance().getProcessor(taskInfo.getParameters().getProcessorId());
        if (processor == null) {
            throw new DBWebException("Wrong data processor '" + taskInfo.getParameters().getProcessorId() + "'");
        }
        String fileName = taskInfo.getExportFileName();
        if (!CommonUtils.isEmpty(fileName)) {
            fileName += "." + WebDataTransferUtils.getProcessorFileExtension(processor, taskInfo.getParameters().getProcessorProperties());
        } else {
            fileName = taskInfo.getDataFileId();
        }
        fileName = WebDataTransferUtils.normalizeFileName(fileName, taskInfo.getParameters().getOutputSettings());
        session.addInfoMessage("Download data ...");
        response.setHeader("Content-Type", processor.getContentType());
        response.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");

        dtManager.exportDataTransferToStream(session.getProgressMonitor(), taskInfo, response.getOutputStream());
    }
}