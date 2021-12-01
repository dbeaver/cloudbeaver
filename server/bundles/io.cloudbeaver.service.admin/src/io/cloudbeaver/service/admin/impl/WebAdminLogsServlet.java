package io.cloudbeaver.service.admin.impl;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.WebServiceServletBase;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.dbeaver.utils.MimeTypes;
import org.jkiss.utils.IOUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

public class WebAdminLogsServlet extends WebServiceServletBase {

    private static final Log log = Log.getLog(WebAdminLogsServlet.class);

    public WebAdminLogsServlet(CBApplication application) {
        super(application);
    }

    @Override
    protected void processServiceRequest(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        if (!session.hasPermission(DBWConstants.PERMISSION_ADMIN)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Logs accessible for admins only");
            return;
        }

        String logId = request.getPathInfo();
        String logFileName = ".log";
        if ("debug".equals(logId)) {
            logFileName = DBConstants.DEBUG_LOG_FILE_NAME;
        }
        if (logFileName.contains("/") || logFileName.contains("\\")) {
            throw new DBWebException("Bad log file name");
        }
        Path logFile = GeneralUtils.getMetadataFolder().resolve(logFileName);
        if (!Files.exists(logFile)) {
            throw new DBWebException("Log file '" + logFileName + "' not found");
        }

        response.setHeader("Content-Type", MimeTypes.TEXT_PLAIN);
        if (logFileName.equals(".log")) {
            logFileName = "server.log";
        }
        response.setHeader("Content-Disposition", "attachment; filename=\"" + logFileName + "\"");

        try (InputStream is = Files.newInputStream(logFile)) {
            IOUtils.copyStream(is, response.getOutputStream());
        }
    }

}