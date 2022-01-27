package io.cloudbeaver.server.servlets;

import org.eclipse.core.runtime.FileLocator;
import org.jkiss.dbeaver.Log;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;

public class CBImageServlet extends HttpServlet {

    private static final Log log = Log.getLog(CBImageServlet.class);

    public CBImageServlet() {

    }

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String iconId = request.getPathInfo();
        while (iconId.startsWith("/")) {
            iconId = iconId.substring(1);
        }
        if (CommonUtils.isEmpty(iconId)) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Image ID missing");
            return;
        }
        if (!iconId.startsWith("platform:/plugin")) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Bad image ID");
            return;
        }
        int divPos = iconId.lastIndexOf(".");
        if (divPos == -1) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Bad image extension");
            return;
        }
        String iconPath = iconId.substring(0, divPos);
        String iconExt = iconId.substring(divPos + 1);
        try {
            String bigIconPath = iconPath + "@2x." + iconExt;
            URL iconURL = FileLocator.find(new URL(bigIconPath));
            if (iconURL == null) {
                iconURL = FileLocator.find(new URL(iconId));
            }
            if (iconURL == null) {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Image not found");
                return;
            }

            response.setContentType("image/" + iconExt);
            setExpireTime(response); // 3 days
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            try (InputStream is = new BufferedInputStream(iconURL.openStream())) {
                IOUtils.copyStream(is, buffer);
            }
            response.setContentLength(buffer.size());
            response.getOutputStream().write(buffer.toByteArray());
        } catch (Exception e) {
            log.error(e);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Error reading image " + iconId + ": " + e.getMessage());
            return;
        }
    }

    private void setExpireTime(HttpServletResponse response) {
        // Http 1.0 header, set a fix expires date.
        response.setDateHeader("Expires", System.currentTimeMillis() + CBStaticServlet.STATIC_CACHE_SECONDS * 1000);
        // Http 1.1 header, set a time after now.
        response.setHeader("Cache-Control", "public, max-age=" + CBStaticServlet.STATIC_CACHE_SECONDS);
    }


}