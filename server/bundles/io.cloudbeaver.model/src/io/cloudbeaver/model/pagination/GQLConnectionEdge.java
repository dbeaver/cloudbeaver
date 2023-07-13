/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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
package io.cloudbeaver.model.pagination;

/**
 * GraphQL connection edge
 */
public class GQLConnectionEdge<T> {
    private final T node;
    private final String cursor;

    public GQLConnectionEdge(T node, String cursor) {
        this.node = node;
        this.cursor = cursor;
    }

    public T getNode() {
        return node;
    }

    public String getCursor() {
        return cursor;
    }
}
