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
package io.cloudbeaver.service.ai.gql;

import io.cloudbeaver.WebServiceUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.ai.registry.AIEngineDescriptor;
import org.jkiss.dbeaver.model.meta.Property;

public class WebAIEngine {

    @NotNull
    private final AIEngineDescriptor descriptor;

    public WebAIEngine(@NotNull AIEngineDescriptor descriptor) {
        this.descriptor = descriptor;
    }

    @NotNull
    @Property
    public String getId() {
        return descriptor.getId();
    }

    @NotNull
    @Property
    public String getName() {
        return descriptor.getLabel();
    }

    @Nullable
    @Property
    public String getIcon() {
        return WebServiceUtils.makeIconId(descriptor.getIcon());
    }

}
