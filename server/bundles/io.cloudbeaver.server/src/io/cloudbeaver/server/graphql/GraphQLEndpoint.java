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
package io.cloudbeaver.server.graphql;

import com.google.gson.*;
import graphql.*;
import graphql.execution.*;
import graphql.execution.instrumentation.Instrumentation;
import graphql.language.SourceLocation;
import graphql.schema.DataFetchingEnvironment;
import graphql.schema.GraphQLSchema;
import graphql.schema.PropertyDataFetcherHelper;
import graphql.schema.idl.SchemaGenerator;
import graphql.schema.idl.SchemaParser;
import graphql.schema.idl.TypeDefinitionRegistry;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.HttpConstants;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.DBWServiceBindingGraphQL;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.utils.ServletAppUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public class GraphQLEndpoint extends HttpServlet {

    private static final Log log = Log.getLog(GraphQLEndpoint.class);

    private static final boolean DEBUG = true;

    private static final String HEADER_ACCESS_CONTROL_ALLOW_ORIGIN = "Access-Control-Allow-Origin";
    private static final String HEADER_ACCESS_CONTROL_ALLOW_HEADERS = "Access-Control-Allow-Headers";
    private static final String HEADER_ACCESS_CONTROL_ALLOW_CREDENTIALS = "Access-Control-Allow-Credentials";

    private static final String CORE_SCHEMA_FILE_NAME = "schema/schema.graphqls";
    private final GraphQL graphQL;

    private static final Gson gson = new GsonBuilder()
        .serializeNulls()
        .setPrettyPrinting()
        .create();
    private GraphQLBindingContext bindingContext;

    public GraphQLEndpoint(Instrumentation instrumentation) {
        GraphQLSchema schema = buildSchema();

        PropertyDataFetcherHelper.setUseLambdaFactory(false);
        graphQL = GraphQL
            .newGraphQL(schema)
            .instrumentation(instrumentation)
            .queryExecutionStrategy(new WebExecutionStrategy())
            .mutationExecutionStrategy(new WebExecutionStrategy())
            .build();
    }

    private GraphQLSchema buildSchema() {
        SchemaParser schemaParser = new SchemaParser();
        TypeDefinitionRegistry parsedSchema = new TypeDefinitionRegistry();

        try (InputStream schemaStream = WebServiceUtils.openStaticResource(CORE_SCHEMA_FILE_NAME)) {
            try (Reader schemaReader = new InputStreamReader(schemaStream)) {
                parsedSchema.merge(schemaParser.parse(schemaReader));
            }
        } catch (IOException e) {
            throw new RuntimeException("Error reading core schema", e);
        }

        List<String> addedBindings = new ArrayList<>();
        for (DBWServiceBindingGraphQL wsd : WebServiceRegistry.getInstance().getWebServices(DBWServiceBindingGraphQL.class)) {
            try {
                TypeDefinitionRegistry typeDefinition = wsd.getTypeDefinition();
                if (typeDefinition != null) {
                    addedBindings.add(wsd.getClass().getSimpleName());
                    parsedSchema.merge(typeDefinition);
                }
            } catch (DBWebException e) {
                log.warn("Error obtaining web service type definitions", e);
            }
        }
        log.debug("Schema extensions loaded: " + String.join(",", addedBindings));

        SchemaGenerator schemaGenerator = new SchemaGenerator();
        bindingContext = new GraphQLBindingContext();
        return schemaGenerator.makeExecutableSchema(parsedSchema, bindingContext.buildRuntimeWiring());
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) {
        setDevelHeaders(request, response);
    }

    private void setDevelHeaders(HttpServletRequest request, HttpServletResponse response) {
        if (ServletAppUtils.getServletApplication().getServerConfiguration().isDevelMode()) {
            // response.setHeader(HEADER_ACCESS_CONTROL_ALLOW_ORIGIN, "*");
            // response.setHeader(HEADER_ACCESS_CONTROL_ALLOW_HEADERS, "*");
            // response.setHeader(HEADER_ACCESS_CONTROL_ALLOW_CREDENTIALS, "*");

            String referrer = request.getHeader("referer");

            try {
                URL url = new URL(referrer);
                String protocol = url.getProtocol();
                String host = url.getHost();
                int port = url.getPort();

                String origin;

                // if the port is not explicitly specified in the input, it will be -1.
                if (port == -1) {
                    origin = String.format("%s://%s", protocol, host);
                } else {
                    origin = String.format("%s://%s:%d", protocol, host, port);
                }

                // for local machine must be defined explicitly:
                response.setHeader(HEADER_ACCESS_CONTROL_ALLOW_ORIGIN, origin);
                response.setHeader(HEADER_ACCESS_CONTROL_ALLOW_HEADERS, "Set-Cookie, Content-Type");
                response.setHeader(HEADER_ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
            } catch (Throwable t) {}
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String contentType = request.getContentType();
        if (CommonUtils.isEmpty(contentType) || !contentType.startsWith(HttpConstants.TYPE_JSON)) {
            String error = "Bad request," + (CommonUtils.isEmpty(contentType)
                ? " content type is missing"
                : " incorrect content type:" + contentType);
            response.sendError(400, error);
            return;
        }
        String postBody = IOUtils.readToString(request.getReader());
        JsonElement json = gson.fromJson(postBody, JsonElement.class);
        if (json instanceof JsonArray array) {
            setDevelHeaders(request, response);
            response.setContentType(GraphQLConstants.CONTENT_TYPE_JSON_UTF8);
            response.getWriter().print("[\n");

            int reqCount = 0;
            for (int i = 0; i < array.size(); i++) {
                if (reqCount > 0) {
                    response.getWriter().print(",\n");
                }
                JsonElement item = array.get(i);
                if (item instanceof JsonObject) {
                    executeSingleQuery(request, response, (JsonObject) item);
                    reqCount++;
                }
            }

            response.getWriter().print("\n]");
        } else if (json instanceof JsonObject reqObject) {
            executeSingleQuery(request, response, reqObject);
        } else {
            response.sendError(400, "Bad JSON request");
        }
    }

    private void executeSingleQuery(HttpServletRequest request, HttpServletResponse response, JsonObject reqObject) throws IOException {
        JsonElement query = reqObject.get("query");
        if (query == null) {
            response.sendError(400, "Query not specified");
            return;
        }
        JsonElement varJSON = reqObject.get("variables");
        Map<String, Object> variables = varJSON == null ? null : gson.fromJson(varJSON, JSONUtils.MAP_TYPE_TOKEN);

        JsonElement operNameJSON = reqObject.get("operationName");

        executeQuery(request, response, query.getAsString(), variables, operNameJSON == null || operNameJSON instanceof JsonNull ? null : operNameJSON.getAsString());
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String path = request.getPathInfo();
        if (path == null) {
            path = request.getServletPath();
        }
        boolean develMode = ServletAppUtils.getServletApplication().getServerConfiguration().isDevelMode();

        if (path.contentEquals("/schema.json") && develMode) {
            executeQuery(request, response, GraphQLConstants.SCHEMA_READ_QUERY, null, null);
        } else if (path.contentEquals("/console") && develMode) {
            try (InputStream consolePageStream = WebServiceUtils.openStaticResource("static/graphiql/index.html")) {
                IOUtils.copyStream(consolePageStream, response.getOutputStream());
            }
        } else {
            String query = request.getParameter("query");
            if (query != null) {
                executeQuery(request, response, query, null, request.getParameter("operationName"));
            } else {
                response.sendError(400, "Bad GET request");
            }
        }
    }

    private void executeQuery(HttpServletRequest request, HttpServletResponse response, String query, Map<String, Object> variables, String operationName) throws IOException {
        Map<String, Object> mapOfContext =
            Map.of(
                "request", request,
                "response", response,
                "bindingContext", bindingContext);
        ExecutionInput.Builder contextBuilder = ExecutionInput.newExecutionInput()
            .graphQLContext(mapOfContext)
            .query(query);
        if (variables != null) {
            contextBuilder.variables(variables);
        }
        if (operationName != null) {
            contextBuilder.operationName(operationName);
        }
        {
            String apiCall = operationName;
//            if (!CommonUtils.isEmpty(apiCall)) {
//                if (variables != null) {
//                    apiCall += " (" + variables + ")";
//                }
//            }
            String sessionId = GraphQLLoggerUtil.getSessionId(request);
            String userId = GraphQLLoggerUtil.getUserId(request);
            String loggerMessage = GraphQLLoggerUtil.buildLoggerMessage(sessionId, userId, variables);
            if (apiCall != null) {
                log.debug("API > " + apiCall + loggerMessage);
            } else if (DEBUG) {
                log.debug("API > " + query + loggerMessage);
            }
        }
        ExecutionInput executionInput = contextBuilder.build();
        ExecutionResult executionResult = graphQL.execute(executionInput);

        Map<String, Object> resJSON = executionResult.toSpecification();
        String resString = gson.toJson(resJSON);
        setDevelHeaders(request, response);
        response.setContentType(GraphQLConstants.CONTENT_TYPE_JSON_UTF8);
        response.getWriter().print(resString);
    }

    private static class WebExecutionStrategy extends AsyncExecutionStrategy {

        public WebExecutionStrategy() {
            super(new WebDataFetcherExceptionHandler());
        }
    }

    private static class WebDataFetcherExceptionHandler implements DataFetcherExceptionHandler {
        @Override
        public CompletableFuture<DataFetcherExceptionHandlerResult> handleException(DataFetcherExceptionHandlerParameters handlerParameters) {
            Throwable exception = handlerParameters.getException();
            if (exception instanceof GraphQLException && exception.getCause() != null) {
                exception = exception.getCause();
            }
            if (exception instanceof InvocationTargetException) {
                exception = ((InvocationTargetException) exception).getTargetException();
            }
            log.debug("GraphQL call failed at '" + handlerParameters.getPath() + "'" /*+ ", " + handlerParameters.getArgumentValues()*/, exception);

            // Log in session
            WebSession webSession = WebServiceBindingBase.findWebSession(handlerParameters.getDataFetchingEnvironment());
            if (webSession != null) {
                webSession.addSessionError(exception);
            }

            SourceLocation sourceLocation = handlerParameters.getSourceLocation();
            ResultPath path = handlerParameters.getPath();

            DataFetcherExceptionHandlerResult.Builder handlerResult = DataFetcherExceptionHandlerResult.newResult();
            if (!(exception instanceof GraphQLError)) {
                exception = new DBWebException(exception.getMessage(), exception);
            }
            if (exception instanceof DBWebException) {
                ((DBWebException) exception).setPath(path.toList());
                ((DBWebException) exception).setLocations(Collections.singletonList(sourceLocation));
            }
            var result = handlerResult.error((GraphQLError) exception).build();
            return CompletableFuture.completedFuture(result);
        }
    }


    public static HttpServletRequest getServletRequest(DataFetchingEnvironment env) {
        GraphQLContext context = env.getGraphQlContext();
        HttpServletRequest request = context.get("request");
        if (request == null) {
            throw new IllegalStateException("Null request");
        }
        return request;
    }

    public static HttpServletResponse getServletResponse(DataFetchingEnvironment env) {
        GraphQLContext context = env.getGraphQlContext();
        HttpServletResponse response = context.get("response");
        if (response == null) {
            throw new IllegalStateException("Null response");
        }
        return response;
    }

    public static DBWBindingContext getBindingContext(DataFetchingEnvironment env) {
        GraphQLContext context = env.getGraphQlContext();
        return context.get("bindingContext");
    }

}