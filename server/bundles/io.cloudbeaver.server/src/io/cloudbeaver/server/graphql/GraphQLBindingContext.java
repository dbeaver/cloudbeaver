package io.cloudbeaver.server.graphql;

import graphql.scalars.ExtendedScalars;
import graphql.schema.idl.RuntimeWiring;
import graphql.schema.idl.TypeRuntimeWiring;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.registry.WebServiceDescriptor;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.DBWServiceBinding;
import io.cloudbeaver.service.DBWServiceBindingGraphQL;
import org.jkiss.dbeaver.Log;

class GraphQLBindingContext implements DBWBindingContext {

    private static final Log log = Log.getLog(GraphQLBindingContext.class);

    private TypeRuntimeWiring.Builder queryType;
    private TypeRuntimeWiring.Builder mutationType;
    private RuntimeWiring.Builder runtimeWiring;

    GraphQLBindingContext() {
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
        runtimeWiring = RuntimeWiring.newRuntimeWiring();
        runtimeWiring
            .scalar(ExtendedScalars.DateTime)
            .scalar(ExtendedScalars.Object);
        queryType = TypeRuntimeWiring.newTypeWiring("Query");
        mutationType = TypeRuntimeWiring.newTypeWiring("Mutation");

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

        return runtimeWiring.build();
    }


}