package io.cloudbeaver.service.sql;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.WebServiceServletBase;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.utils.CommonUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
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
        Matcher urlMatcher = URL_PATTERN.matcher(valuePath);
        if (!urlMatcher.matches()) {
            throw new DBWebException("Invalid URI format");
        }

        String connectionId = urlMatcher.group(1);
        String contextId = urlMatcher.group(2);
        String resultsId = urlMatcher.group(3);
        String rowNum = urlMatcher.group(4);
        String attrName = urlMatcher.group(5);

        WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(
            WebServiceBindingSQL.getWebConnection(session, connectionId));
        WebSQLContextInfo sqlContext = WebServiceBindingSQL.getSQLContext(sqlProcessor, contextId);
        WebSQLResultsInfo sqlResults = sqlContext.getResults(resultsId);


        throw new DBWebException("Not implemented yet");
/*
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
*/
    }

}