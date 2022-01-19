/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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
package io.cloudbeaver.service.sql;

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.exec.plan.DBCPlan;
import org.jkiss.dbeaver.model.exec.plan.DBCPlanNode;

import java.util.*;

/**
 * WebSQLExecutionPlan.
 */
public class WebSQLExecutionPlan {

    private static final Log log = Log.getLog(WebSQLExecutionPlan.class);

    private final WebSession webSession;
    private final DBCPlan plan;

    public WebSQLExecutionPlan(WebSession webSession, DBCPlan plan) {
        this.webSession = webSession;
        this.plan = plan;
    }

    public String getQuery() {
        return plan.getQueryString();
    }

    public WebSQLExecutionPlanNode[] getNodes() {
        Map<String, Object> options = new LinkedHashMap<>();
        Map<DBCPlanNode, String> idMap = new IdentityHashMap<>();

        List<WebSQLExecutionPlanNode> result = new ArrayList<>();

        for (DBCPlanNode node : plan.getPlanNodes(options)) {
            addNodeWithNested(result, null, node, idMap);
        }

        return result.toArray(new WebSQLExecutionPlanNode[0]);
    }

    private void addNodeWithNested(List<WebSQLExecutionPlanNode> result, DBCPlanNode parentNode, DBCPlanNode node, Map<DBCPlanNode, String> idMap) {
        String parentId = idMap.get(parentNode);
        String nodeId = String.valueOf(idMap.size());
        idMap.put(node, nodeId);
        result.add(new WebSQLExecutionPlanNode(webSession, node, nodeId, parentId));
        Collection<? extends DBCPlanNode> nested = node.getNested();
        if (nested != null) {
            for (DBCPlanNode nn : nested) {
                addNodeWithNested(result, node, nn, idMap);
            }
        }
    }

}
