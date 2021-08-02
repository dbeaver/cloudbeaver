package io.cloudbeaver.server.jetty;

import io.cloudbeaver.server.CBApplication;
import org.eclipse.jetty.http.HttpContent;
import org.eclipse.jetty.http.HttpField;
import org.eclipse.jetty.http.HttpHeader;
import org.eclipse.jetty.server.ResourceService;
import org.eclipse.jetty.servlet.DefaultServlet;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;

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
        ResourceService resourceService = new ProxyResourceService();
        resourceService.setCacheControl(new HttpField(HttpHeader.CACHE_CONTROL, "public, max-age=" + STATIC_CACHE_SECONDS));
        return resourceService;
    }


    private static class ProxyResourceService extends ResourceService {
        @Override
        protected boolean sendData(HttpServletRequest request, HttpServletResponse response, boolean include, HttpContent content, Enumeration<String> reqRanges) throws IOException {
            if (content.getResource().getName().endsWith("index.html")) {
                return patchIndexHtml(response, content);
            }
            return super.sendData(request, response, include, content, reqRanges);
        }

        private boolean patchIndexHtml(HttpServletResponse response, HttpContent content) throws IOException {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            content.getResource().writeTo(baos, 0, content.getContentLengthValue());
            String indexContents = new String(baos.toByteArray(), StandardCharsets.UTF_8);
            indexContents = indexContents.replace("{ROOT_URI}", CBApplication.getInstance().getRootURI());
            byte[] indexBytes = indexContents.getBytes(StandardCharsets.UTF_8);

            putHeaders(response, content, indexBytes.length);
            response.getOutputStream().write(indexBytes);

            return true;
        }
    }

}