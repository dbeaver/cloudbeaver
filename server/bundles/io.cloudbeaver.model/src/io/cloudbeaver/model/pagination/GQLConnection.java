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

import java.util.List;

/**
 * GraphQL connection
 */
public class GQLConnection<T> {
    private final int totalCount;
    private final List<GQLConnectionEdge<T>> edges;
    private final GQLPageInfo pageInfo;

    public GQLConnection(int totalCount, List<GQLConnectionEdge<T>> edges, GQLPageInfo pageInfo) {
        this.totalCount = totalCount;
        this.edges = edges;
        this.pageInfo = pageInfo;
    }

    public int getTotalCount() {
        return totalCount;
    }

    public List<GQLConnectionEdge<T>> getEdges() {
        return edges;
    }

    public GQLPageInfo getPageInfo() {
        return pageInfo;
    }
}
