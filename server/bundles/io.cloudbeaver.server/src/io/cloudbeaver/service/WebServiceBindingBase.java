/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebSessionProvider;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.graphql.GraphQLEndpoint;
import io.cloudbeaver.service.security.SMUtils;
import io.cloudbeaver.utils.ServletAppUtils;
import io.cloudbeaver.utils.WebDataSourceUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.utils.ArrayUtils;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.lang.reflect.*;

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
    public TypeDefinitionRegistry getTypeDefinition() {
        return loadSchemaDefinition(getClass(), schemaFileName);
    }

    /**
     * Creates proxy for permission checks and other general API calls validation/logging.
     */
    protected API_TYPE getService(DataFetchingEnvironment env) {
        Object proxyImpl = Proxy.newProxyInstance(getClass().getClassLoader(), new Class[]{apiInterface}, new ServiceInvocationHandler(serviceImpl, env));
        return apiInterface.cast(proxyImpl);
    }

    public static TypeDefinitionRegistry loadSchemaDefinition(Class<?> theClass, String schemaPath) {
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
        return WebAppUtils.getWebApplication().getSessionManager().getWebSession(
            getServletRequest(env), getServletResponse(env));
    }

    protected static WebSession getWebSession(DataFetchingEnvironment env, boolean errorOnNotFound) throws DBWebException {
        return WebAppUtils.getWebApplication().getSessionManager().getWebSession(
            getServletRequest(env), getServletResponse(env), errorOnNotFound);
    }

    protected static String getProjectReference(DataFetchingEnvironment env) {
        return env.getArgument("projectId");
    }

    @NotNull
    protected static WebConnectionInfo getWebConnection(DataFetchingEnvironment env) throws DBWebException {
        return getWebConnection(getWebSession(env), getProjectReference(env), env.getArgument("connectionId"));
    }

    /**
     * Returns WebSession from cache or null
     */
    @Nullable
    public static WebSession findWebSession(DataFetchingEnvironment env) {
        return WebAppUtils.getWebApplication().getSessionManager().findWebSession(
            getServletRequest(env));
    }

    public static WebSession findWebSession(DataFetchingEnvironment env, boolean errorOnNotFound) throws DBWebException {
        return WebAppUtils.getWebApplication().getSessionManager().findWebSession(
            getServletRequest(env), errorOnNotFound);
    }

    @NotNull
    public static WebConnectionInfo getWebConnection(WebSession session, String projectId, String connectionId) throws DBWebException {
        return WebDataSourceUtils.getWebConnectionInfo(session, projectId, connectionId);
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
                try {
                    WebActionSet actionSet = method.getDeclaringClass().getAnnotation(WebActionSet.class);
                    if (actionSet != null) {
                        checkServicePermissions(method, actionSet);
                    }
                    WebAction webAction = method.getAnnotation(WebAction.class);
                    if (webAction != null) {
                        checkActionPermissions(method, webAction);
                    }
                    WebProjectAction projectAction = method.getAnnotation(WebProjectAction.class);
                    if (projectAction != null) {
                        checkObjectActionPermissions(method, projectAction, args);
                    }
                    beforeWebActionCall(webAction, method, args);
                    try {
                        return method.invoke(impl, args);
                    } finally {
                        afterWebActionCall(webAction, method, args);
                    }
                } catch (InvocationTargetException e) {
                    throw e.getTargetException();
                }
            } catch (Throwable ex) {
                log.error("Unexpected error during gql request", ex);
                if (SMUtils.isRefreshTokenExpiredExceptionWasHandled(ex)) {
                    WebSession webSession = findWebSession(env);
                    if (webSession != null) {
                        webSession.resetUserState();
                    }
                    throw new DBWebException(
                        "Authentication has expired",
                        DBWebException.ERROR_CODE_SESSION_EXPIRED,
                        ex
                    );
                }
                for (Class<?> exType : method.getExceptionTypes()) {
                    if (exType.isInstance(ex)) {
                        throw ex;
                    }
                }
                // Undeclared exception - wrap
                throw new InvocationTargetException(ex);
            }
        }

        private void checkObjectActionPermissions(Method method, WebProjectAction objectAction, Object[] args) throws DBException {
            WebSession webSession = findWebSession(env);
            if (webSession != null && webSession.hasPermission(DBWConstants.PERMISSION_ADMIN)) {
                return;
            }
            String[] requireProjectPermissions = objectAction.requireProjectPermissions();
            if (requireProjectPermissions.length > 0) {
                int objectIdArgumentIndex = -1;
                for (int i = 0; i < method.getParameters().length; i++) {
                    Parameter parameter = method.getParameters()[i];
                    if (parameter.isAnnotationPresent(WebObjectId.class)) {
                        if (String.class != parameter.getAnnotatedType().getType()) {
                            throw new DBWebExceptionAccessDenied("Invalid object id type");
                        }
                        objectIdArgumentIndex = i;
                        break;
                    }
                }

                if (objectIdArgumentIndex < 0) {
                    throw new DBWebExceptionAccessDenied("Project id argument not found");
                }
                if (webSession == null) {
                    throw new DBException("Web session not instantiated");
                }

                String projectId = args[objectIdArgumentIndex] == null ? null : String.valueOf(args[objectIdArgumentIndex]);
                // we should always get the project from the session, even if projectId is null - the active project
                // will be returned
                WebProjectImpl project = webSession.getProjectById(projectId);
                if (project == null) {
                    throw new DBException("Project not found:" + projectId);
                }
                RMProject rmProject = project.getRMProject();

                for (String reqProjectPermission : requireProjectPermissions) {
                    if (!rmProject.hasProjectPermission(reqProjectPermission)) {
                        throw new DBWebExceptionAccessDenied("Access denied");
                    }
                }
            }
        }

        private void checkServicePermissions(Method method, WebActionSet actionSet) throws DBWebException {
            String[] features = actionSet.requireFeatures();
            ServletApplication servletApplication = ServletAppUtils.getServletApplication();
            for (String feature : features) {
                if (!servletApplication.isConfigurationMode() &&
                    !servletApplication.getAppConfiguration().isFeatureEnabled(feature)) {
                    throw new DBWebException("Feature " + feature + " is disabled");
                }
            }
        }

        private void checkActionPermissions(@NotNull Method method, @NotNull WebAction webAction) throws DBWebException {
            var application = WebAppUtils.getWebPlatform().getApplication();
            if (application.isInitializationMode() && webAction.initializationRequired()) {
                String message = "Server initialization in progress: "
                    + String.join(",", application.getInitActions().values()) + ".\nDo not restart the server.";
                throw new DBWebExceptionServerNotInitialized(message);
            }
            String[] reqPermissions = webAction.requirePermissions();
            if (reqPermissions.length == 0 && !webAction.authRequired()) {
                return;
            }
            WebSession session = findWebSession(env);
            if (session == null) {
                throw new DBWebExceptionAccessDenied("No open session - anonymous access restricted");
            }
            if (!application.isConfigurationMode()) {
                if (webAction.authRequired() && !session.isAuthorizedInSecurityManager()) {
                    log.debug("Anonymous access to " + method.getName() + " restricted");
                    throw new DBWebExceptionAccessDenied("Anonymous access restricted");
                }

                // Check license
                if (application.isLicenseRequired() && !application.isLicenseValid()) {
                    if (!ArrayUtils.contains(reqPermissions, DBWConstants.PERMISSION_ADMIN)) {
                        String errorMessage = "Invalid server license";
                        String licenseStatus = application.getLicenseStatus();
                        if (licenseStatus != null) {
                            errorMessage = errorMessage + ": " + licenseStatus;
                        }
                        // Only admin permissions are allowed
                        throw new DBWebExceptionLicenseRequired(errorMessage);
                    }
                }
                // Check permissions
                for (String rp : reqPermissions) {
                    if (!session.hasPermission(rp)) {
                        log.debug("Access to " + method.getName() + " denied for " + session.getUser());
                        throw new DBWebExceptionAccessDenied("Access denied");
                    }
                }
            }
        }

    }

    // Perform any checks before action call
    protected void beforeWebActionCall(WebAction webAction, Method method, Object[] args) throws DBException {
        setLogContext(method, args);
    }

    protected void afterWebActionCall(WebAction webAction, Method method, Object[] args) throws DBException {
        Log.setContext(null);
    }

    protected void setLogContext(Method method, Object[] args) {
        WebSession activeSession = null;
        if (args != null && args.length > 0) {
            for (Object arg : args) {
                if (arg instanceof WebSession) {
                    activeSession = (WebSession) arg;
                    break;
                } else if (arg instanceof WebSessionProvider) {
                    activeSession = ((WebSessionProvider) arg).getWebSession();
                    break;
                }
            }
        }

        if (activeSession != null) {
            String contextName;
            if (activeSession.getUser() != null) {
                contextName = "@" + activeSession.getUser().getUserId();
            } else {
                contextName = "::" + activeSession.getSessionId();
            }
            Log.setContext(Log.buildContext(contextName));
        } else {
            Log.setContext(null);
        }
    }


}
