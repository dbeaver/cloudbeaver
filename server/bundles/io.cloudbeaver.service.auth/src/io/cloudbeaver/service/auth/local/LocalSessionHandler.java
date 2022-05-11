package io.cloudbeaver.service.auth.local;

import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBServerAction;
import io.cloudbeaver.service.DBWSessionHandler;
import org.jkiss.dbeaver.DBException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class LocalSessionHandler implements DBWSessionHandler {
    public static final String ACTION_CONSOLE = "console";
    @Override
    public boolean handleSessionOpen(WebSession webSession, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        return handleSessionAuth(webSession);
    }

    @Override
    public boolean handleSessionAuth(WebSession webSession) throws DBException, IOException {
        if (webSession.getUser() == null) {
            return false;
        }
        CBServerAction action = CBServerAction.fromSession(webSession, true);
        if (action != null) {
            if (ACTION_CONSOLE.equals(action.getActionId())) {
                openDatabaseConsole(webSession, action);
            }
        }
        return false;
    }

    private void openDatabaseConsole(WebSession webSession, CBServerAction action) throws DBException {
        String connectionId = action.getParameter(LocalServletHandler.PARAM_CONNECTION_ID);
        if (connectionId == null) {
            throw new DBException("Connection id not in request");
        }
        WebConnectionInfo connectionInfo = webSession.getWebConnectionInfo(connectionId);
        WebServiceUtils.fireActionParametersOpenEditor(webSession, connectionInfo.getDataSourceContainer());


    }

    @Override
    public boolean handleSessionClose(WebSession webSession) throws DBException, IOException {
        return false;
    }
}
