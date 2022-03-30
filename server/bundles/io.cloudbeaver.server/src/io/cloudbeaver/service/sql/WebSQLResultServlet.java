package io.cloudbeaver.service.sql;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.WebServiceServletBase;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


public class WebSQLResultServlet extends WebServiceServletBase {

    private static final Log log = Log.getLog(WebSQLResultServlet.class);

    // context-id/result-id/row-number/attribute-name
    private static final Pattern URL_PATTERN = Pattern.compile("/?([\\w]+)/([0-9]+)/([0-9]+)/([0-9]+)/(.+)[/\\?]?");

    private final DBWServiceSQL sqlService;

    public WebSQLResultServlet(CBApplication application, DBWServiceSQL sqlService) {
        super(application);
        this.sqlService = sqlService;
    }

    @Override
    protected void processServiceRequest(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {

        String valuePath = request.getPathInfo();
        if (CommonUtils.isEmpty(valuePath)) {
            throw new DBWebException("Result value ID not specified");
        }
        while (valuePath.startsWith("/")) {
            valuePath = valuePath.substring(1);
        }

        File dataFile = new File(WebSQLDataLOBReceiver.DATA_EXPORT_FOLDER, valuePath);
        response.setHeader("Content-Type", "application/octet-stream");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + dataFile.getName() + "\"");
        response.setHeader("Content-Length", String.valueOf(dataFile.length()));

        try (InputStream is = new FileInputStream(dataFile)) {
            IOUtils.copyStream(is, response.getOutputStream());
        }
        Files.deleteIfExists(dataFile.toPath());
    }

}