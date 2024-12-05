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

package io.cloudbeaver.service.rm;

import io.cloudbeaver.model.rm.DBNResourceManagerRoot;
import io.cloudbeaver.utils.ServletAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.navigator.DBNModelExtender;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.navigator.DBNRoot;

public class RMNavigatorModelExtender implements DBNModelExtender {

    @Override
    public DBNNode[] getExtraNodes(@NotNull DBNNode parentNode) {
        if (parentNode instanceof DBNRoot && ServletAppUtils.getServletApplication()
            .getAppConfiguration()
            .isResourceManagerEnabled()) {
            return createRMNodes((DBNRoot) parentNode);
        } else {
            return null;
        }
    }

    private DBNNode[] createRMNodes(DBNRoot root) {
        return new DBNNode[]{
            new DBNResourceManagerRoot(root)
        };
    }

}
