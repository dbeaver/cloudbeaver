package io.cloudbeaver.server.servlets;

import com.google.gson.stream.JsonWriter;
import io.cloudbeaver.server.CBConstants;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.utils.GeneralUtils;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@WebServlet(urlPatterns = "/status")
public class CBStatusServlet extends DefaultServlet {

    private static final Log log = Log.getLog(CBStatusServlet.class);

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType(CBConstants.APPLICATION_JSON);
        Map<String, Object> infoMap = new LinkedHashMap<>();
        infoMap.put("health", "ok");
        infoMap.put("product.name", GeneralUtils.getProductName());
        infoMap.put("product.version", GeneralUtils.getProductVersion().toString());
        try (JsonWriter writer = new JsonWriter(response.getWriter())) {
            JSONUtils.serializeMap(writer, infoMap);
        }
    }

}