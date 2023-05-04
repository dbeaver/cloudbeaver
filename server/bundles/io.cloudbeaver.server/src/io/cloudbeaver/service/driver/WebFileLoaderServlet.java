/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.cloudbeaver.service.driver;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.WebServiceServletBase;
import org.eclipse.jetty.server.Request;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;

import javax.servlet.MultipartConfigElement;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.lang.reflect.Type;
import java.util.Map;

@MultipartConfig
public class WebFileLoaderServlet extends WebServiceServletBase {

    private static final Log log = Log.getLog(WebFileLoaderServlet.class);

    private static final MultipartConfigElement MULTI_PART_CONFIG =
        new MultipartConfigElement(
            CBPlatform.getInstance().getTempFolder(new VoidProgressMonitor(), "temp-file").toString());

    private static final Type MAP_STRING_OBJECT_TYPE = new TypeToken<Map<String, Object>>() {
    }.getType();
    private static final String REQUEST_PARAM_VARIABLES = "variables";
    private static final String REQUEST_PARAM_DRIVER_ID = "driverId";
    private static Gson gson = new GsonBuilder()
        .serializeNulls()
        .setPrettyPrinting()
        .create();

    private final DBWServiceDriver serviceDriver;

    public WebFileLoaderServlet(CBApplication application, DBWServiceDriver serviceDriver) {
        super(application);
        this.serviceDriver = serviceDriver;
    }

    @Override
    protected void processServiceRequest(
        WebSession session,
        HttpServletRequest request,
        HttpServletResponse response
    ) throws DBException, IOException {
        if (request.getMethod().equals("POST")) {
            try {
                request.setAttribute(Request.__MULTIPART_CONFIG_ELEMENT, MULTI_PART_CONFIG);
                // for now, we use it only for loading driver files
                Map<String, Object> variables = gson.fromJson(request.getParameter(REQUEST_PARAM_VARIABLES), MAP_STRING_OBJECT_TYPE);
                var driverId = JSONUtils.getString(variables, REQUEST_PARAM_DRIVER_ID);
                if (driverId == null) {
                    throw new DBWebException("Driver id is not found");
                }
                serviceDriver.addDriverLibraries(session, driverId, request.getParts());
            } catch (Exception e) {
                throw new DBWebException("Servlet exception ", e);
            }
        } else {
            response.sendError(400, "Bad GET request");
        }
    }
}