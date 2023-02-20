/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp
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

package io.cloudbeaver.service.rm;

import io.cloudbeaver.model.rm.DBNResourceManagerRoot;
import io.cloudbeaver.utils.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.navigator.DBNModelExtender;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.navigator.DBNRoot;

public class RMNavigatorModelExtender implements DBNModelExtender {

    @Override
    public DBNNode[] getExtraNodes(@NotNull DBNNode parentNode) {
        if (parentNode instanceof DBNRoot && WebAppUtils.getWebApplication().getAppConfiguration().isResourceManagerEnabled()) {
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
