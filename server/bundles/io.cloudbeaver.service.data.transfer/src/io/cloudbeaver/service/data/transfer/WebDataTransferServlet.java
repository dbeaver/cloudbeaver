package io.cloudbeaver.service.data.transfer;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.server.CloudbeaverApplication;
import io.cloudbeaver.server.CloudbeaverPlatform;
import io.cloudbeaver.server.model.session.WebSession;
import org.jkiss.dbeaver.Log;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class WebDataTransferServlet extends HttpServlet {

    private static final Log log = Log.getLog(WebDataTransferServlet.class);

    private final CloudbeaverApplication application;

    public WebDataTransferServlet(CloudbeaverApplication application) {
        this.application = application;
    }

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String dataFileId = request.getPathInfo();
        while (dataFileId.startsWith("/")) {
            dataFileId = dataFileId.substring(1);
        }

        try {
            WebSession webSession = CloudbeaverPlatform.getInstance().getSessionManager().tryGetWebSession(request.getSession());
            if (webSession == null) {
                throw new DBWebException("No active session");
            }

            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Not implemented");
        } catch (Exception e) {
            log.error(e);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Error reading data: " + e.getMessage());
            return;
        }
    }

}