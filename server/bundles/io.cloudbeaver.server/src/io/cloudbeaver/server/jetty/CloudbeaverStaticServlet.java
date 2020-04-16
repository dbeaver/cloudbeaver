package io.cloudbeaver.server.jetty;

import org.eclipse.jetty.server.ResourceService;
import org.eclipse.jetty.servlet.DefaultServlet;

import javax.servlet.annotation.WebServlet;

@WebServlet(urlPatterns = "/")
public class CloudbeaverStaticServlet extends DefaultServlet {

    public CloudbeaverStaticServlet() {
//        super(makeResourceService());
        super();
    }

    private static ResourceService makeResourceService() {
        ResourceService resourceService = new ResourceService();
        return resourceService;
    }


}