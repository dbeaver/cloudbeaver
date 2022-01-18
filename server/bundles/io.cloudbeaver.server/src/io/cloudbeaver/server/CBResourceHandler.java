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
package io.cloudbeaver.server;

import org.eclipse.core.resources.IFile;
import org.eclipse.core.resources.IResource;
import org.eclipse.core.runtime.CoreException;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPResourceHandler;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.navigator.DBNNodeWithResource;
import org.jkiss.dbeaver.model.navigator.DBNResource;

import java.util.List;

/**
 * Default resource handler
 */
public class CBResourceHandler implements DBPResourceHandler {

    public static final CBResourceHandler INSTANCE = new CBResourceHandler();

    @Override
    public int getFeatures(IResource resource) {
        if (resource instanceof IFile) {
            return FEATURE_OPEN | FEATURE_DELETE | FEATURE_RENAME;
        } else {
            return FEATURE_DELETE | FEATURE_RENAME | FEATURE_CREATE_FOLDER | FEATURE_MOVE_INTO;
        }
    }

    @NotNull
    @Override
    public String getTypeName(@NotNull IResource resource) {
        return "resource"; //$NON-NLS-1$
    }

    @Override
    public String getResourceDescription(@NotNull IResource resource) {
        return "";
    }

    @Override
    public List<DBPDataSourceContainer> getAssociatedDataSources(DBNResource resource) {
        return null;
    }

    @NotNull
    @Override
    public String getResourceNodeName(@NotNull IResource resource) {
        return resource.getName();
    }

    @NotNull
    @Override
    public DBNResource makeNavigatorNode(@NotNull DBNNode parentNode, @NotNull IResource resource) throws CoreException, DBException {
        DBNResource node = new DBNResource(parentNode, resource, this);
        return node;
    }

    @Override
    public void updateNavigatorNodeFromResource(@NotNull DBNNodeWithResource node, @NotNull IResource resource) {
    }

    @Override
    public void openResource(@NotNull IResource resource) throws CoreException, DBException {
    }

}
