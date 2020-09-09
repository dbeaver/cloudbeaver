/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
import io.cloudbeaver.DBWService;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.DBWebExceptionAccessDenied;
import io.cloudbeaver.WebAction;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.server.graphql.GraphQLEndpoint;
import org.jkiss.utils.CommonUtils;

import javax.servlet.http.HttpServletRequest;
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

    protected static DBWBindingContext getBindingContext(DataFetchingEnvironment env) {
        return GraphQLEndpoint.getBindingContext(env);
    }

    protected static WebSession getWebSession(DataFetchingEnvironment env) throws DBWebException {
        return CBPlatform.getInstance().getSessionManager().getWebSession(
            getServletRequest(env));
    }

    protected static WebSession getWebSession(DataFetchingEnvironment env, boolean errorOnNotFound) throws DBWebException {
        return CBPlatform.getInstance().getSessionManager().getWebSession(
            getServletRequest(env), errorOnNotFound);
    }

    protected static WebSession findWebSession(DataFetchingEnvironment env) {
        return CBPlatform.getInstance().getSessionManager().findWebSession(
            getServletRequest(env));
    }

    protected static WebConnectionInfo getWebConnection(DataFetchingEnvironment env) throws DBWebException {
        return getWebSession(env).getWebConnectionInfo(env.getArgument("connectionId"));
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
                    checkPermissions(webAction);
                }
                return method.invoke(impl, args);
            } catch (InvocationTargetException e) {
                throw e.getTargetException();
            }
        }

        private void checkPermissions(WebAction webAction) throws DBWebExceptionAccessDenied {
            String[] reqPermissions = webAction.requirePermissions();
            if (reqPermissions.length == 0) {
                return;
            }
            WebSession session = findWebSession(env);
            if (session == null) {
                throw new DBWebExceptionAccessDenied("Anonymous access restricted");
            }
            if (!CBApplication.getInstance().isConfigurationMode()) {
                // Check permissions
                Set<String> sessionPermissions = session.getSessionPermissions();
                if (CommonUtils.isEmpty(sessionPermissions)) {
                    throw new DBWebExceptionAccessDenied("Anonymous access restricted");
                }
                for (String rp : reqPermissions) {
                    if (!sessionPermissions.contains(rp)) {
                        throw new DBWebExceptionAccessDenied("Access denied");
                    }
                }
            }
        }

    }
}
