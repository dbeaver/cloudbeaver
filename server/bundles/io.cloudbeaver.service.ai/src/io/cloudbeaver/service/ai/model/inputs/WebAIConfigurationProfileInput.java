/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp
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
package io.cloudbeaver.service.ai.model.inputs;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.util.Map;

public record WebAIConfigurationProfileInput(
    @NotNull String profileId,
    @Nullable String profileName,
    @Nullable String engineId,
    @Nullable Map<String, Object> configuration
) {
}
