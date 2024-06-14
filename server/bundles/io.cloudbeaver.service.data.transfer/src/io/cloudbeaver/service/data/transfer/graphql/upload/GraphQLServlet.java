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
package io.cloudbeaver.service.data.transfer.graphql.upload;

import graphql.schema.GraphQLSchema;

import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.InputStream;
import java.util.Map;


@WebServlet(name = "GraphQLServlet", urlPatterns = "/graphql")
@MultipartConfig
public class GraphQLServlet extends SimpleGraphQLHttpServlet {

    private final GraphQLConfiguration configuration;

    public GraphQLServlet() {
        this.configuration = GraphQLConfiguration.with(buildSchema()).build();
    }

    private GraphQLSchema buildSchema() {
        String schema = "type Query{hello: String}\n"
            + "type Mutation {\n"
            + "    singleUpload(file: Upload!): File!\n"
            + "}\n"
            + "type File {\n"
            + "    id: ID!\n"
            + "    name: String!\n"
            + "}\n"
            + "scalar Upload";

        SchemaParser schemaParser = new SchemaParser();
        TypeDefinitionRegistry typeDefinitionRegistry = schemaParser.parse(schema);

        RuntimeWiring runtimeWiring = RuntimeWiring.newRuntimeWiring()
            .scalar(UploadScalar.Upload)
            .type("Mutation", builder -> builder.dataFetcher("singleUpload", new FileUploadDataFetcher()))
            .build();

        SchemaGenerator schemaGenerator = new SchemaGenerator();
        return schemaGenerator.makeExecutableSchema(typeDefinitionRegistry, runtimeWiring);
    }

    @Override
    protected GraphQLConfiguration getConfiguration() {
        return this.configuration;
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) {
        boolean isMultipart = request.getContentType().startsWith("multipart/form-data");

        if (isMultipart) {
            Map<String, byte[]> fileMap = MultipartFileHandler.parseMultipartRequest(request);

            // Пример обработки файлов:
            for (Map.Entry<String, byte[]> entry : fileMap.entrySet()) {
                String fileName = entry.getKey();
                byte[] fileContent = entry.getValue();

                // Обработка файла (например, сохранение на диск)
                // saveFile(fileName, fileContent);
            }
        } else {
            super.doPost(request, response);
        }
    }
}