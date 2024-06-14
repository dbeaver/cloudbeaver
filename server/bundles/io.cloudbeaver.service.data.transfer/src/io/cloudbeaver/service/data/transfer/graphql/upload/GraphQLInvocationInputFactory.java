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
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.websocket.Session;
import jakarta.websocket.server.HandshakeRequest;

import java.util.List;
import java.util.function.Supplier;

public class GraphQLInvocationInputFactory implements GraphQLSubscriptionInvocationInputFactory {

  private final Supplier<GraphQLSchemaServletProvider> schemaProviderSupplier;
  private final Supplier<GraphQLServletContextBuilder> contextBuilderSupplier;
  private final Supplier<GraphQLServletRootObjectBuilder> rootObjectBuilderSupplier;

  protected GraphQLInvocationInputFactory(
      Supplier<GraphQLSchemaServletProvider> schemaProviderSupplier,
      Supplier<GraphQLServletContextBuilder> contextBuilderSupplier,
      Supplier<GraphQLServletRootObjectBuilder> rootObjectBuilderSupplier) {
    this.schemaProviderSupplier = schemaProviderSupplier;
    this.contextBuilderSupplier = contextBuilderSupplier;
    this.rootObjectBuilderSupplier = rootObjectBuilderSupplier;
  }

  public static Builder newBuilder(GraphQLSchema schema) {
    return new Builder(new DefaultGraphQLSchemaServletProvider(schema));
  }

  public static Builder newBuilder(GraphQLSchemaServletProvider schemaProvider) {
    return new Builder(schemaProvider);
  }

  public static Builder newBuilder(Supplier<GraphQLSchemaServletProvider> schemaProviderSupplier) {
    return new Builder(schemaProviderSupplier);
  }

  public GraphQLSchemaProvider getSchemaProvider() {
    return schemaProviderSupplier.get();
  }

  public GraphQLSingleInvocationInput create(
      GraphQLRequest graphQLRequest, HttpServletRequest request, HttpServletResponse response) {
    return create(graphQLRequest, request, response, false);
  }

  public GraphQLBatchedInvocationInput create(
      ContextSetting contextSetting,
      List<GraphQLRequest> graphQLRequests,
      HttpServletRequest request,
      HttpServletResponse response) {
    return create(contextSetting, graphQLRequests, request, response, false);
  }

  public GraphQLSingleInvocationInput createReadOnly(
      GraphQLRequest graphQLRequest, HttpServletRequest request, HttpServletResponse response) {
    return create(graphQLRequest, request, response, true);
  }

  public GraphQLBatchedInvocationInput createReadOnly(
      ContextSetting contextSetting,
      List<GraphQLRequest> graphQLRequests,
      HttpServletRequest request,
      HttpServletResponse response) {
    return create(contextSetting, graphQLRequests, request, response, true);
  }

  public GraphQLSingleInvocationInput create(GraphQLRequest graphQLRequest) {
    return new GraphQLSingleInvocationInput(
        graphQLRequest,
        schemaProviderSupplier.get().getSchema(),
        contextBuilderSupplier.get().build(),
        rootObjectBuilderSupplier.get().build());
  }

  private GraphQLSingleInvocationInput create(
      GraphQLRequest graphQLRequest,
      HttpServletRequest request,
      HttpServletResponse response,
      boolean readOnly) {
    return new GraphQLSingleInvocationInput(
        graphQLRequest,
        readOnly
            ? schemaProviderSupplier.get().getReadOnlySchema(request)
            : schemaProviderSupplier.get().getSchema(request),
        contextBuilderSupplier.get().build(request, response),
        rootObjectBuilderSupplier.get().build(request));
  }

  private GraphQLBatchedInvocationInput create(
      ContextSetting contextSetting,
      List<GraphQLRequest> graphQLRequests,
      HttpServletRequest request,
      HttpServletResponse response,
      boolean readOnly) {
    return contextSetting.getBatch(
        graphQLRequests,
        readOnly
            ? schemaProviderSupplier.get().getReadOnlySchema(request)
            : schemaProviderSupplier.get().getSchema(request),
        () -> contextBuilderSupplier.get().build(request, response),
        rootObjectBuilderSupplier.get().build(request));
  }

  @Override
  public GraphQLSingleInvocationInput create(
      GraphQLRequest graphQLRequest, SubscriptionSession session) {
    HandshakeRequest request =
        (HandshakeRequest) session.getUserProperties().get(HandshakeRequest.class.getName());
    return new GraphQLSingleInvocationInput(
        graphQLRequest,
        schemaProviderSupplier.get().getSchema(request),
        contextBuilderSupplier.get().build((Session) session.unwrap(), request),
        rootObjectBuilderSupplier.get().build(request));
  }

  public GraphQLBatchedInvocationInput create(
      ContextSetting contextSetting, List<GraphQLRequest> graphQLRequest, Session session) {
    HandshakeRequest request =
        (HandshakeRequest) session.getUserProperties().get(HandshakeRequest.class.getName());
    return contextSetting.getBatch(
        graphQLRequest,
        schemaProviderSupplier.get().getSchema(request),
        () -> contextBuilderSupplier.get().build(session, request),
        rootObjectBuilderSupplier.get().build(request));
  }

  public static class Builder {

    private final Supplier<GraphQLSchemaServletProvider> schemaProviderSupplier;
    private Supplier<GraphQLServletContextBuilder> contextBuilderSupplier =
        DefaultGraphQLServletContextBuilder::new;
    private Supplier<GraphQLServletRootObjectBuilder> rootObjectBuilderSupplier =
        DefaultGraphQLRootObjectBuilder::new;

    public Builder(GraphQLSchemaServletProvider schemaProvider) {
      this(() -> schemaProvider);
    }

    public Builder(Supplier<GraphQLSchemaServletProvider> schemaProviderSupplier) {
      this.schemaProviderSupplier = schemaProviderSupplier;
    }

    public Builder withGraphQLContextBuilder(GraphQLServletContextBuilder contextBuilder) {
      return withGraphQLContextBuilder(() -> contextBuilder);
    }

    public Builder withGraphQLContextBuilder(
        Supplier<GraphQLServletContextBuilder> contextBuilderSupplier) {
      this.contextBuilderSupplier = contextBuilderSupplier;
      return this;
    }

    public Builder withGraphQLRootObjectBuilder(GraphQLServletRootObjectBuilder rootObjectBuilder) {
      return withGraphQLRootObjectBuilder(() -> rootObjectBuilder);
    }

    public Builder withGraphQLRootObjectBuilder(
        Supplier<GraphQLServletRootObjectBuilder> rootObjectBuilderSupplier) {
      this.rootObjectBuilderSupplier = rootObjectBuilderSupplier;
      return this;
    }

    public GraphQLInvocationInputFactory build() {
      return new GraphQLInvocationInputFactory(
          schemaProviderSupplier, contextBuilderSupplier, rootObjectBuilderSupplier);
    }
  }
}
