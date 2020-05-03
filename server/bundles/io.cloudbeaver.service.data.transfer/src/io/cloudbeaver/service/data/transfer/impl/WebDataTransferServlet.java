package io.cloudbeaver.service.data.transfer.impl;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.data.transfer.DBWServiceDataTransfer;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferProcessorDescriptor;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferRegistry;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

public class WebDataTransferServlet extends HttpServlet {

    private static final Log log = Log.getLog(WebDataTransferServlet.class);

    private final CBApplication application;
    private final DBWServiceDataTransfer dtManager;

    public WebDataTransferServlet(CBApplication application, DBWServiceDataTransfer dtManager) {
        this.application = application;
        this.dtManager = dtManager;
    }

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        try {
            String dataFileId = request.getPathInfo();
            if (CommonUtils.isEmpty(dataFileId)) {
                throw new DBWebException("Data ID not specified");
            }
            while (dataFileId.startsWith("/")) {
                dataFileId = dataFileId.substring(1);
            }

            WebSession webSession = CBPlatform.getInstance().getSessionManager().findWebSession(request);
            if (webSession == null) {
                throw new DBWebException("No active session");
            }
            WebDataTransferSessionConfig dtConfig = WebDataTransferUtils.getSessionDataTransferConfig(webSession);
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
                fileName += "." + WebDataTransferUtils.getProcessorFileExtension(processor);
            } else {
                fileName = taskInfo.getDataFileId();
            }

            File dataFile = taskInfo.getDataFile();

            response.setHeader("Content-Type", processor.getContentType());
            response.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");
            response.setHeader("Content-Length", String.valueOf(dataFile.length()));

            try (InputStream is = new FileInputStream(dataFile)) {
                IOUtils.copyStream(is, response.getOutputStream());
            }

            // TODO: cleanup export files ASAP?
            if (false) {
                dtConfig.removeTask(taskInfo);
            }

            //response.ok(HttpServletResponse.SC_BAD_REQUEST, "Not implemented");
        } catch (Exception e) {
            log.error(e);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Error reading data: " + e.getMessage());
            return;
        }
    }

}