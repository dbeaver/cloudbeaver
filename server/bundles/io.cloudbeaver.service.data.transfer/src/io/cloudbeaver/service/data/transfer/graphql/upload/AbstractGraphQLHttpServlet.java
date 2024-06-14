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

import graphql.ExecutionResult;
import graphql.schema.GraphQLFieldDefinition;
import jakarta.servlet.Servlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


public abstract class AbstractGraphQLHttpServlet extends HttpServlet
    implements Servlet, GraphQLMBean {

  protected abstract GraphQLConfiguration getConfiguration();

  public void addListener(GraphQLServletListener servletListener) {
    getConfiguration().add(servletListener);
  }

  public void removeListener(GraphQLServletListener servletListener) {
    getConfiguration().remove(servletListener);
  }

  @Override
  public String[] getQueries() {
    return getConfiguration()
        .getInvocationInputFactory()
        .getSchemaProvider()
        .getSchema()
        .getQueryType()
        .getFieldDefinitions()
        .stream()
        .map(GraphQLFieldDefinition::getName)
        .toArray(String[]::new);
  }

  @Override
  public String[] getMutations() {
    return getConfiguration()
        .getInvocationInputFactory()
        .getSchemaProvider()
        .getSchema()
        .getMutationType()
        .getFieldDefinitions()
        .stream()
        .map(GraphQLFieldDefinition::getName)
        .toArray(String[]::new);
  }

  @Override
  public String executeQuery(String query) {
    try {
      GraphQLRequest graphQLRequest = createQueryOnlyRequest(query);
      GraphQLSingleInvocationInput invocationInput =
          getConfiguration().getInvocationInputFactory().create(graphQLRequest);
      ExecutionResult result =
          getConfiguration().getGraphQLInvoker().query(invocationInput).getResult();
      return getConfiguration().getObjectMapper().serializeResultAsJson(result);
    } catch (Exception e) {
      return e.getMessage();
    }
  }

  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
    doRequest(req, resp);
  }

  @Override
  protected void doPost(HttpServletRequest req, HttpServletResponse resp) {
    doRequest(req, resp);
  }

  private void doRequest(HttpServletRequest request, HttpServletResponse response) {
    try {
      getConfiguration().getHttpRequestHandler().handle(request, response);
    } catch (Exception t) {
    }
  }
}
