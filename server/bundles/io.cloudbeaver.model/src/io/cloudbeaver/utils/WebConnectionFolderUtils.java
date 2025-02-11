/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.utils;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebConnectionFolderInfo;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBPDataSourceFolder;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.utils.CommonUtils;

public class WebConnectionFolderUtils {

    public static WebConnectionFolderInfo getFolderInfo(
        WebSession session, @Nullable String projectId, String folderPath
    ) throws DBWebException {
        DBPDataSourceFolder folder = null;
        if (!CommonUtils.isEmpty(folderPath)) {
            folder = session.getProjectById(projectId).getDataSourceRegistry().getFolder(folderPath);
        }
        if (folder != null) {
            return new WebConnectionFolderInfo(session, folder);
        } else {
            throw new DBWebException("Folder '" + folderPath + "' not found");
        }
    }

    public static void validateConnectionFolder(String folderName) throws DBWebException {
        if (folderName.contains("/")) {
            throw new DBWebException("Folder name '" + folderName + "' contains illegal characters: /");
        }
    }

    public static DBPDataSourceFolder createFolder(WebConnectionFolderInfo parentFolder, String newName, DBPDataSourceRegistry registry) throws DBWebException {
        DBPDataSourceFolder folder = registry.addFolder(parentFolder == null ? null : parentFolder.getDataSourceFolder(), newName);
        return folder;
    }
}
