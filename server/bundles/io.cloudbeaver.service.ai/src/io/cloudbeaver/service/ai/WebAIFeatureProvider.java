/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp
 *
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
 */
package io.cloudbeaver.service.ai;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.navigator.DBWFeatureProvider;
import io.cloudbeaver.utils.ServletAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.ai.utils.AIUtils;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseNode;
import org.jkiss.dbeaver.model.navigator.DBNNode;

import java.util.ArrayList;
import java.util.List;

public class WebAIFeatureProvider implements DBWFeatureProvider {
    public static final String AI_FEATURE_ID = "ai";
    private static final String FEATURE_CAN_DESCRIBE_OBJECT = "canDescribeObject";

    @NotNull
    @Override
    public List<String> getNodeFeatures(@NotNull WebSession webSession, @NotNull DBNNode node) {
        List<String> features = new ArrayList<>();
        if (!ServletAppUtils.getServletApplication().getAppConfiguration().isFeatureEnabled(AI_FEATURE_ID)) {
            return features;
        }
        if (node instanceof DBNDatabaseNode element && AIUtils.isEligible(element.getObject())) {
            features.add(FEATURE_CAN_DESCRIBE_OBJECT);
        }
        return features;
    }
}
