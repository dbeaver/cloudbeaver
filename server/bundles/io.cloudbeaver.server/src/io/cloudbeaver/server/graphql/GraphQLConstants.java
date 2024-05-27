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

public class GraphQLConstants {

    public static final String CONTENT_TYPE_JSON_UTF8 = "application/json;charset=UTF-8";

    public static final String SCHEMA_READ_QUERY = "  __schema {\n" +
        "      queryType { name }\n" +
        "      mutationType { name }\n" +
        "      subscriptionType { name }\n" +
        "      types {\n" +
        "        ...FullType\n" +
        "      }\n" +
        "      directives {\n" +
        "        name\n" +
        "        description\n" +
        "        locations\n" +
        "        args {\n" +
        "          ...InputValue\n" +
        "        }\n" +
        "      }\n" +
        "    }\n" +
        "  }\n" +
        "  fragment FullType on __Type {\n" +
        "    kind\n" +
        "    name\n" +
        "    description\n" +
        "    fields(includeDeprecated: true) {\n" +
        "      name\n" +
        "      description\n" +
        "      args {\n" +
        "        ...InputValue\n" +
        "      }\n" +
        "      type {\n" +
        "        ...TypeRef\n" +
        "      }\n" +
        "      isDeprecated\n" +
        "      deprecationReason\n" +
        "    }\n" +
        "    inputFields {\n" +
        "      ...InputValue\n" +
        "    }\n" +
        "    interfaces {\n" +
        "      ...TypeRef\n" +
        "    }\n" +
        "    enumValues(includeDeprecated: true) {\n" +
        "      name\n" +
        "      description\n" +
        "      isDeprecated\n" +
        "      deprecationReason\n" +
        "    }\n" +
        "    possibleTypes {\n" +
        "      ...TypeRef\n" +
        "    }\n" +
        "  }\n" +
        "  fragment InputValue on __InputValue {\n" +
        "    name\n" +
        "    description\n" +
        "    type { ...TypeRef }\n" +
        "    defaultValue\n" +
        "  }\n" +
        "  fragment TypeRef on __Type {\n" +
        "    kind\n" +
        "    name\n" +
        "    ofType {\n" +
        "      kind\n" +
        "      name\n" +
        "      ofType {\n" +
        "        kind\n" +
        "        name\n" +
        "        ofType {\n" +
        "          kind\n" +
        "          name\n" +
        "        }\n" +
        "      }\n" +
        "    }";

}