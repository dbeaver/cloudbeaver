/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2021 DBeaver Corp and others
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
package io.cloudbeaver.service;

import graphql.schema.DataFetchingEnvironment;
import graphql.schema.idl.SchemaParser;
import graphql.schema.idl.TypeDefinitionRegistry;
import io.cloudbeaver.*;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.server.graphql.GraphQLEndpoint;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Set;

/**
 * Web service implementation
 */
public abstract class WebServiceBindingBase<API_TYPE extends DBWService> implements DBWServiceBindingGraphQL {

    private static final Log log = Log.getLog(WebServiceBindingBase.class);

    private final Class<API_TYPE> apiInterface;
    private final API_TYPE serviceImpl;
    private final String schemaFileName;

    public WebServiceBindingBase(Class<API_TYPE> apiInterface, API_TYPE impl, String schemaFileName) {
        this.apiInterface = apiInterface;
        this.serviceImpl = impl;
        this.schemaFileName = schemaFileName;
    }

    protected API_TYPE getServiceImpl() {
        return serviceImpl;
    }

    @Override
    public TypeDefinitionRegistry getTypeDefinition() throws DBWebException {
        return loadSchemaDefinition(getClass(), schemaFileName);
    }

    /**
     * Creates proxy for permission checks and other general API calls validation/logging.
     */
    protected  API_TYPE getService(DataFetchingEnvironment env) {
        Object proxyImpl = Proxy.newProxyInstance(getClass().getClassLoader(), new Class[]{apiInterface}, new ServiceInvocationHandler(serviceImpl, env));
        return apiInterface.cast(proxyImpl);
    }

    public static TypeDefinitionRegistry loadSchemaDefinition(Class theClass, String schemaPath) throws DBWebException {
        try (InputStream schemaStream = theClass.getClassLoader().getResourceAsStream(schemaPath)) {
            if (schemaStream == null) {
                throw new IOException("Schema file '" + schemaPath + "' not found");
            }
            try (Reader schemaReader = new InputStreamReader(schemaStream)) {
                return new SchemaParser().parse(schemaReader);
            }
        } catch (IOException e) {
            throw new RuntimeException("Error reading core schema", e);
        }
    }

    protected static HttpServletRequest getServletRequest(DataFetchingEnvironment env) {
        return GraphQLEndpoint.getServletRequest(env);
    }

    protected static HttpServletResponse getServletResponse(DataFetchingEnvironment env) {
        return GraphQLEndpoint.getServletResponse(env);
    }

    protected static DBWBindingContext getBindingContext(DataFetchingEnvironment env) {
        return GraphQLEndpoint.getBindingContext(env);
    }

    protected static WebSession getWebSession(DataFetchingEnvironment env) throws DBWebException {
        return CBPlatform.getInstance().getSessionManager().getWebSession(
            getServletRequest(env), getServletResponse(env));
    }

    protected static WebSession getWebSession(DataFetchingEnvironment env, boolean errorOnNotFound) throws DBWebException {
        return CBPlatform.getInstance().getSessionManager().getWebSession(
            getServletRequest(env), getServletResponse(env), errorOnNotFound);
    }

    @NotNull
    protected static WebConnectionInfo getWebConnection(DataFetchingEnvironment env) throws DBWebException {
        return getWebConnection(getWebSession(env), env.getArgument("connectionId"));
    }

    public static WebSession findWebSession(DataFetchingEnvironment env) {
        return CBPlatform.getInstance().getSessionManager().findWebSession(
            getServletRequest(env));
    }

    @NotNull
    public static WebConnectionInfo getWebConnection(WebSession session, String connectionId) throws DBWebException {
        return session.getWebConnectionInfo(connectionId);
    }

    private class ServiceInvocationHandler implements InvocationHandler {
        private final API_TYPE impl;
        private final DataFetchingEnvironment env;

        ServiceInvocationHandler(API_TYPE impl, DataFetchingEnvironment env) {
            this.impl = impl;
            this.env = env;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            try {
                WebAction webAction = method.getAnnotation(WebAction.class);
                if (webAction != null) {
                    checkPermissions(method, webAction);
                }
                return method.invoke(impl, args);
            } catch (InvocationTargetException e) {
                throw e.getTargetException();
            }
        }

        private void checkPermissions(@NotNull Method method, @NotNull WebAction webAction) throws DBWebException {
            String[] reqPermissions = webAction.requirePermissions();
            if (reqPermissions.length == 0) {
                return;
            }
            WebSession session = findWebSession(env);
            if (session == null) {
                throw new DBWebExceptionAccessDenied("No open session - anonymous access restricted");
            }
            CBApplication application = CBApplication.getInstance();
            if (!application.isConfigurationMode()) {
                Set<String> sessionPermissions = session.getSessionPermissions();
                if (CommonUtils.isEmpty(sessionPermissions)) {
                    log.debug("Anonymous access to " + method.getName() + " restricted");
                    throw new DBWebExceptionAccessDenied("Anonymous access restricted");
                }

                // Check license
                if (application.isLicenseRequired() && !application.isLicenseValid()) {
                    if (!ArrayUtils.contains(reqPermissions, DBWConstants.PERMISSION_ADMIN)) {
                        // Only admin permissions are allowed
                        throw new DBWebExceptionLicenseRequired("Invalid server license");
                    }
                }
                // Check permissions
                for (String rp : reqPermissions) {
                    if (!sessionPermissions.contains(rp)) {
                        log.debug("Access to " + method.getName() + " denied for " + session.getUser());
                        throw new DBWebExceptionAccessDenied("Access denied");
                    }
                }
            }
        }

    }
}
