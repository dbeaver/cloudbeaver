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
package io.cloudbeaver.api;

import graphql.schema.DataFetchingEnvironment;
import graphql.schema.idl.SchemaParser;
import graphql.schema.idl.TypeDefinitionRegistry;
import io.cloudbeaver.DBWebException;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/**
 * Web service implementation
 */
public abstract class WebServiceBase<API_TYPE extends DBWServiceAPI> implements DBWServiceGraphQL {

    private final Class<API_TYPE> apiInterface;
    private API_TYPE serviceImpl;


    public WebServiceBase(Class<API_TYPE> apiInterface, API_TYPE impl) {
        this.apiInterface = apiInterface;
        this.serviceImpl = impl;
    }

    protected API_TYPE getServiceImpl() {
        return serviceImpl;
    }

    /**
     * Creates proxy for permission checks and other general API calls validation/logging.
     */
    protected  API_TYPE getAPI(DataFetchingEnvironment env) {
        Object proxyImpl = Proxy.newProxyInstance(getClass().getClassLoader(), new Class[]{apiInterface}, new ServiceInvocationHandler(serviceImpl));
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

    private class ServiceInvocationHandler implements InvocationHandler {
        private final API_TYPE impl;

        ServiceInvocationHandler(API_TYPE impl) {
            this.impl = impl;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            return method.invoke(impl, args);
        }
    }
}
