package io.cloudbeaver.service.sql;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.servlets.CBStaticServlet;
import io.cloudbeaver.service.WebServiceServletBase;
import org.eclipse.jetty.server.Request;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import jakarta.servlet.MultipartConfigElement;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.regex.Pattern;

@MultipartConfig
public class WebSQLResultServlet extends WebServiceServletBase {

    private static final Log log = Log.getLog(WebSQLResultServlet.class);
    private static final MultipartConfigElement MULTI_PART_CONFIG = new MultipartConfigElement(WebSQLDataLOBReceiver.DATA_EXPORT_FOLDER.toAbsolutePath().toString());

    // context-id/result-id/row-number/attribute-name
    private static final Pattern URL_PATTERN = Pattern.compile("/?([\\w]+)/([0-9]+)/([0-9]+)/([0-9]+)/(.+)[/\\?]?");

    private final DBWServiceSQL sqlService;

    public WebSQLResultServlet(CBApplication application, DBWServiceSQL sqlService) {
        super(application);
        this.sqlService = sqlService;
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        request.setAttribute(Request.__MULTIPART_CONFIG_ELEMENT, MULTI_PART_CONFIG);
        String fileName = UUID.randomUUID().toString();
        for (Part part : request.getParts()) {
            part.write(WebSQLDataLOBReceiver.DATA_EXPORT_FOLDER + "/" + fileName);
        }
        response.addHeader("fileName", fileName);
    }

    @Override
    protected void processServiceRequest(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        if (request.getMethod().equals("POST")) {
            try {
                doPost(request, response);
            } catch (Exception e) {
                throw new DBWebException("Servlet exception ", e);
            }
        } else {
            String valuePath = request.getPathInfo();
            if (CommonUtils.isEmpty(valuePath)) {
                throw new DBWebException("Result value ID not specified");
            }
            while (valuePath.startsWith("/")) {
                valuePath = valuePath.substring(1);
            }

            Path dataFile = WebSQLDataLOBReceiver.DATA_EXPORT_FOLDER.resolve(valuePath);
            session.addInfoMessage("Download LOB file ...");
            response.setHeader("Content-Type", "application/octet-stream");
            response.setHeader("Content-Disposition", "attachment; filename=\"" + dataFile.getFileName().toString() + "\"");
            response.setHeader("Content-Length", String.valueOf(Files.size(dataFile)));
            response.setDateHeader("Expires", System.currentTimeMillis() + CBStaticServlet.STATIC_CACHE_SECONDS * 1000);
            response.setHeader("Cache-Control", "public, max-age=" + CBStaticServlet.STATIC_CACHE_SECONDS);

            try (InputStream is = Files.newInputStream(dataFile)) {
                IOUtils.copyStream(is, response.getOutputStream());
            }
            Files.deleteIfExists(dataFile);
        }
    }
}