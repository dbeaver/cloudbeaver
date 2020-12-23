package io.cloudbeaver.service.admin.impl;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.dbeaver.utils.MimeTypes;
import org.jkiss.utils.IOUtils;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

public class WebAdminLogsServlet extends HttpServlet {

    private static final Log log = Log.getLog(WebAdminLogsServlet.class);

    private final CBApplication application;

    public WebAdminLogsServlet(CBApplication application) {
        this.application = application;
    }

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        try {
            WebSession webSession = CBPlatform.getInstance().getSessionManager().findWebSession(request);
            if (webSession == null) {
                throw new DBWebException("No active session");
            }
            if (!webSession.hasPermission(DBWConstants.PERMISSION_ADMIN)) {
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
            File logFile = new File(GeneralUtils.getMetadataFolder(), logFileName);
            if (!logFile.exists()) {
                throw new DBWebException("Log file '" + logFileName + "' not found");
            }

            response.setHeader("Content-Type", MimeTypes.TEXT_PLAIN);
            if (logFileName.equals(".log")) {
                logFileName = "server.log";
            }
            response.setHeader("Content-Disposition", "attachment; filename=\"" + logFileName + "\"");

            try (InputStream is = new FileInputStream(logFile)) {
                IOUtils.copyStream(is, response.getOutputStream());
            }
       } catch (Exception e) {
            log.error(e);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Error reading log: " + e.getMessage());
            return;
        }
    }

}