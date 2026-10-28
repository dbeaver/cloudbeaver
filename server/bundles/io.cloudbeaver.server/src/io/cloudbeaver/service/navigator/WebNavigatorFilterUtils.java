/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
package io.cloudbeaver.service.navigator;

import io.cloudbeaver.BaseWebProjectImpl;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.security.SMUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.rm.RMProjectPermission;

/**
 * Permission routing shared by the legacy navigator filter query and mutation.
 */
public final class WebNavigatorFilterUtils {
    private WebNavigatorFilterUtils() {
    }

    public static boolean usesConnectionFilter(@NotNull WebSession session, @NotNull DBNNode node) {
        return session.getUserContext().isNonAnonymousUserAuthorizedInSM() &&
            node.getOwnerProject() instanceof BaseWebProjectImpl webProject &&
            SMUtils.hasProjectPermission(session, webProject.getRMProject(), RMProjectPermission.DATA_SOURCES_EDIT);
    }
}
