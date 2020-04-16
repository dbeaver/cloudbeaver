package io.cloudbeaver.server.graphql;

import graphql.scalars.ExtendedScalars;
import graphql.schema.DataFetchingEnvironment;
import graphql.schema.idl.RuntimeWiring;
import graphql.schema.idl.TypeRuntimeWiring;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.api.DBWModel;
import io.cloudbeaver.api.DBWService;
import io.cloudbeaver.api.DBWServiceGraphQL;
import io.cloudbeaver.api.DBWUtils;
import io.cloudbeaver.server.CloudbeaverPlatform;
import io.cloudbeaver.server.model.WebDatabaseObjectInfo;
import io.cloudbeaver.server.model.WebPropertyFilter;
import io.cloudbeaver.server.model.session.WebSessionManager;
import io.cloudbeaver.server.model.sql.WebSQLDataFilter;
import io.cloudbeaver.server.registry.WebServiceDescriptor;
import io.cloudbeaver.server.registry.WebServiceRegistry;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.runtime.DBWorkbench;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

class GraphQLModel implements DBWModel {

    private static final Log log = Log.getLog(GraphQLModel.class);

    private TypeRuntimeWiring.Builder queryType;
    private TypeRuntimeWiring.Builder mutationType;
    private WebSessionManager sessionManager;

    GraphQLModel() {
    }

    @Override
    public CloudbeaverPlatform getPlatform() {
        return DBWorkbench.getPlatform(CloudbeaverPlatform.class);
    }

    @Override
    public WebSessionManager getSessionManager() {
        return sessionManager;
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

        CloudbeaverPlatform webServiceMain = getPlatform();
        sessionManager = webServiceMain.getSessionManager();

        RuntimeWiring.Builder builder = RuntimeWiring.newRuntimeWiring();
        builder
            .scalar(ExtendedScalars.DateTime)
            .scalar(ExtendedScalars.Object);
        queryType = TypeRuntimeWiring.newTypeWiring("Query");
        mutationType = TypeRuntimeWiring.newTypeWiring("Mutation");

        queryType
            .dataFetcher("serverConfig", env -> webServiceMain.getServerConfig())

            .dataFetcher("driverList", env -> sessionManager.getWebSession(getServletRequest(env)).getDriverList(env.getArgument("id")))
            .dataFetcher("dataSourceList", env -> webServiceMain.getGlobalDataSources())

            .dataFetcher("sessionState", env -> sessionManager.getWebSession(getServletRequest(env)))

            .dataFetcher("readSessionLog", env -> sessionManager.getWebSession(getServletRequest(env)).readLog(
                env.getArgument("maxEntries"),
                env.getArgument("clearEntries")))

            .dataFetcher("navNodeChildren", env -> sessionManager.getWebSession(getServletRequest(env)).getNavigatorNodeChildren(
                env.getArgument("parentPath"), env.getArgument("offset"), env.getArgument("limit"), env.getArgument("onlyFolders")))
            .dataFetcher("navNodeInfo", env -> sessionManager.getWebSession(getServletRequest(env)).getNavigatorNodeInfo(
                env.getArgument("nodePath")))
            .dataFetcher("navRefreshNode", env -> sessionManager.getWebSession(getServletRequest(env)).refreshNavigatorNode(
                env.getArgument("nodePath")
            ))

            .dataFetcher("navGetStructContainers", env -> DBWUtils.getSQLProcessor(sessionManager, env).getStructContainers(
                env.getArgument("catalog")
            ))

            .dataFetcher("sqlDialectInfo", env ->
                DBWUtils.getSQLProcessor(sessionManager, env).getDialectInfo()
            )
            .dataFetcher("sqlCompletionProposals", env ->
                DBWUtils.getSQLContext(sessionManager, env).getCompletionProposals(
                    env.getArgument("query"),
                    env.getArgument("position"),
                    env.getArgument("maxResults")
                )
            )
        ;

        mutationType
            .dataFetcher("openSession", env -> sessionManager.openSession(getServletRequest(env), false))
            .dataFetcher("closeSession", env -> sessionManager.closeSession(getServletRequest(env)))
            .dataFetcher("touchSession", env -> sessionManager.touchSession(getServletRequest(env)))
            .dataFetcher("changeSessionLanguage", env -> {
                sessionManager.getWebSession(getServletRequest(env)).setLocale(env.getArgument("locale"));
                return true;
            })

            .dataFetcher("openConnection", env -> sessionManager.openConnection(getServletRequest(env), env.getArgument("config")))
            .dataFetcher("createConnection", env -> sessionManager.createConnection(getServletRequest(env), env.getArgument("config")))
            .dataFetcher("testConnection", env -> sessionManager.testConnection(getServletRequest(env), env.getArgument("config")))
            .dataFetcher("closeConnection", env -> sessionManager.closeConnection(getServletRequest(env), env.getArgument("id")))

            .dataFetcher("sqlContextCreate", env -> DBWUtils.getSQLProcessor(sessionManager, env).createContext(env.getArgument("defaultCatalog"), env.getArgument("defaultSchema")))
            .dataFetcher("sqlContextDestroy", env -> { DBWUtils.getSQLContext(sessionManager, env).destroy(); return true; } )
            .dataFetcher("sqlContextSetDefaults", env -> { DBWUtils.getSQLContext(sessionManager, env).setDefaults(env.getArgument("defaultCatalog"), env.getArgument("defaultSchema")); return true; })

            .dataFetcher("sqlExecuteQuery", env ->
                DBWUtils.getSQLContext(sessionManager, env).executeQuery(
                    env.getArgument("sql"), getDataFilter(env)
            ))
            .dataFetcher("sqlResultClose", env ->
                DBWUtils.getSQLContext(sessionManager, env).closeResult(env.getArgument("resultId")))

            .dataFetcher("readDataFromContainer", env ->
                DBWUtils.getSQLProcessor(sessionManager, env).readDataFromContainer(
                    DBWUtils.getSQLContext(sessionManager, env),
                    env.getArgument("containerNodePath"), getDataFilter(env)
                ))
            .dataFetcher("updateResultsData", env ->
                DBWUtils.getSQLProcessor(sessionManager, env).updateResultsData(
                    DBWUtils.getSQLContext(sessionManager, env),
                    env.getArgument("resultsId"),
                    env.getArgument("updateRow"),
                    env.getArgument("updateValues")
                ))
            .dataFetcher("asyncSqlExecuteQuery", env ->
                DBWUtils.getSQLContext(sessionManager, env).asyncExecuteQuery(
                    env.getArgument("sql"), getDataFilter(env)
                ))
            .dataFetcher("asyncTaskStatus", env ->
                sessionManager.getWebSession(getServletRequest(env)).asyncTaskStatus(
                    env.getArgument("id"))
            )
            .dataFetcher("asyncTaskCancel", env ->
                sessionManager.getWebSession(getServletRequest(env)).asyncTaskCancel(
                    env.getArgument("id"))
            )
        ;

        // Extend queries and mutations
        for (WebServiceDescriptor wsd : WebServiceRegistry.getInstance().getWebServices()) {
            DBWService instance;
            try {
                instance = wsd.getInstance();
            } catch (Exception e) {
                log.error(e);
                continue;
            }
            if (instance instanceof DBWServiceGraphQL) {
                try {
                    ((DBWServiceGraphQL) instance).bindWiring(this);
                } catch (DBWebException e) {
                    log.warn("Error obtaining web service '" + wsd.getId() + "' type definitions", e);
                }
            }
        }

        builder.type(queryType);
        builder.type(mutationType);

        builder.type(TypeRuntimeWiring.newTypeWiring("DatabaseObjectInfo")
                .dataFetcher("properties", env -> {
                    Map<String, Object> filterProps = env.getArgument("filter");
                    WebPropertyFilter filter = filterProps == null ? null : new WebPropertyFilter(filterProps);
                    return ((WebDatabaseObjectInfo)env.getSource()).filterProperties(filter);
                })
            );
        builder.type(TypeRuntimeWiring.newTypeWiring("AsyncTaskResult").typeResolver(env -> {
                return env.getObject();
            })
        );

        return builder.build();
    }

    private HttpServletRequest getServletRequest(DataFetchingEnvironment env) {
        return DBWUtils.getServletRequest(env);
    }

    ///////////////////////////////////////
    // Helpers

    private static WebSQLDataFilter getDataFilter(DataFetchingEnvironment env) {
        Map<String, Object> filterProps = env.getArgument("filter");
        return filterProps == null ? null : new WebSQLDataFilter(filterProps);
    }


}