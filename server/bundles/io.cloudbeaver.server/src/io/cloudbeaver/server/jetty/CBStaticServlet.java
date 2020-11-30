package io.cloudbeaver.server.jetty;

import org.eclipse.jetty.http.HttpField;
import org.eclipse.jetty.http.HttpHeader;
import org.eclipse.jetty.server.ResourceService;
import org.eclipse.jetty.servlet.DefaultServlet;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(urlPatterns = "/")
public class CBStaticServlet extends DefaultServlet {

    public static final int STATIC_CACHE_SECONDS = 60 * 60 * 24 * 3;

    public CBStaticServlet() {
        super(makeResourceService());
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        super.doGet(request, response);
    }

    private static ResourceService makeResourceService() {
        ResourceService resourceService = new ResourceService();
        resourceService.setCacheControl(new HttpField(HttpHeader.CACHE_CONTROL, "public, max-age=" + STATIC_CACHE_SECONDS));
        return resourceService;
    }


}