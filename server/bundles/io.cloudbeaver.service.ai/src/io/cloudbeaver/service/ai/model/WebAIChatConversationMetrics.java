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
package io.cloudbeaver.service.ai.model;

import org.jkiss.dbeaver.model.ai.AIExtendedUsage;

public class WebAIChatConversationMetrics {
    private final int totalInputTokens;
    private final int totalOutputTokens;

    private WebAIChatConversationMetrics(int totalInputTokens, int totalOutputTokens) {
        this.totalInputTokens = totalInputTokens;
        this.totalOutputTokens = totalOutputTokens;
    }

    public int getTotalInputTokens() {
        return totalInputTokens;
    }

    public int getTotalOutputTokens() {
        return totalOutputTokens;
    }

    public static WebAIChatConversationMetrics from(AIExtendedUsage aiExtendedUsage) {
        return new WebAIChatConversationMetrics(
            aiExtendedUsage.totalInputTokens(),
            aiExtendedUsage.totalOutputTokens()
        );
    }
}
