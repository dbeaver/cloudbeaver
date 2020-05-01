package io.cloudbeaver.server.graphql;

import graphql.scalars.ExtendedScalars;
import graphql.schema.idl.RuntimeWiring;
import graphql.schema.idl.TypeRuntimeWiring;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.DBWServiceBinding;
import io.cloudbeaver.service.DBWServiceBindingGraphQL;
import io.cloudbeaver.model.session.WebSessionManager;
import io.cloudbeaver.registry.WebServiceDescriptor;
import io.cloudbeaver.registry.WebServiceRegistry;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.runtime.DBWorkbench;

class GraphQLBindingContext implements DBWBindingContext {

    private static final Log log = Log.getLog(GraphQLBindingContext.class);

    private TypeRuntimeWiring.Builder queryType;
    private TypeRuntimeWiring.Builder mutationType;
    private WebSessionManager sessionManager;
    private RuntimeWiring.Builder runtimeWiring;

    GraphQLBindingContext() {
    }

    @Override
    public CBPlatform getPlatform() {
        return DBWorkbench.getPlatform(CBPlatform.class);
    }

    @Override
    public WebSessionManager getSessionManager() {
        return sessionManager;
    }

    @Override
    public RuntimeWiring.Builder getRuntimeWiring() {
        return runtimeWiring;
    }

    @Override
    public TypeRuntimeWiring.Builder getQueryType() {
        return queryType;
    }

    @Override
    public TypeRuntimeWiring.Builder getMutationType() {
        return mutationType;
    }

    RuntimeWiring buildRuntimeWiring() {

        CBPlatform webServiceMain = getPlatform();
        sessionManager = webServiceMain.getSessionManager();

        runtimeWiring = RuntimeWiring.newRuntimeWiring();
        runtimeWiring
            .scalar(ExtendedScalars.DateTime)
            .scalar(ExtendedScalars.Object);
        queryType = TypeRuntimeWiring.newTypeWiring("Query");
        mutationType = TypeRuntimeWiring.newTypeWiring("Mutation");

        queryType
            .dataFetcher("serverConfig", env -> webServiceMain.getServerConfig())

            .dataFetcher("driverList", env -> sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env)).getDriverList(env.getArgument("id")))
            .dataFetcher("dataSourceList", env -> webServiceMain.getGlobalDataSources())

            .dataFetcher("sessionPermissions", env -> sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env)).getSessionPermissions())
            .dataFetcher("sessionState", env -> sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env)))

            .dataFetcher("readSessionLog", env -> sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env), false, true).readLog(
                env.getArgument("maxEntries"),
                env.getArgument("clearEntries")))
        ;

        mutationType
            .dataFetcher("openSession", env -> sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env), false))
            .dataFetcher("closeSession", env -> sessionManager.closeSession(GraphQLEndpoint.getServletRequest(env)))
            .dataFetcher("touchSession", env -> sessionManager.touchSession(GraphQLEndpoint.getServletRequest(env)))
            .dataFetcher("changeSessionLanguage", env -> {
                sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env)).setLocale(env.getArgument("locale"));
                return true;
            })

            .dataFetcher("openConnection", env -> sessionManager.openConnection(GraphQLEndpoint.getServletRequest(env), env.getArgument("config")))
            .dataFetcher("createConnection", env -> sessionManager.createConnection(GraphQLEndpoint.getServletRequest(env), env.getArgument("config")))
            .dataFetcher("testConnection", env -> sessionManager.testConnection(GraphQLEndpoint.getServletRequest(env), env.getArgument("config")))
            .dataFetcher("closeConnection", env -> sessionManager.closeConnection(GraphQLEndpoint.getServletRequest(env), env.getArgument("id")))

            .dataFetcher("asyncTaskStatus", env ->
                sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env)).asyncTaskStatus(
                    env.getArgument("id"))
            )
            .dataFetcher("asyncTaskCancel", env ->
                sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env)).asyncTaskCancel(
                    env.getArgument("id"))
            )
        ;

        // Extend queries and mutations
        for (WebServiceDescriptor wsd : WebServiceRegistry.getInstance().getWebServices()) {
            DBWServiceBinding instance;
            try {
                instance = wsd.getInstance();
            } catch (Exception e) {
                log.error(e);
                continue;
            }
            if (instance instanceof DBWServiceBindingGraphQL) {
                try {
                    ((DBWServiceBindingGraphQL) instance).bindWiring(this);
                } catch (DBWebException e) {
                    log.warn("Error obtaining web service '" + wsd.getId() + "' type definitions", e);
                }
            }
        }

        runtimeWiring.type(queryType);
        runtimeWiring.type(mutationType);

        runtimeWiring.type(TypeRuntimeWiring.newTypeWiring("AsyncTaskResult").typeResolver(env -> {
                return env.getObject();
            })
        );

        return runtimeWiring.build();
    }


}