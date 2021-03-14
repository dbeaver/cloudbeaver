package io.cloudbeaver.service.data.transfer.impl;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.WebServiceServletBase;
import io.cloudbeaver.service.data.transfer.DBWServiceDataTransfer;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferProcessorDescriptor;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferRegistry;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

public class WebDataTransferServlet extends WebServiceServletBase {

    private static final Log log = Log.getLog(WebDataTransferServlet.class);

    private final DBWServiceDataTransfer dtManager;

    public WebDataTransferServlet(CBApplication application, DBWServiceDataTransfer dtManager) {
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
    }

}