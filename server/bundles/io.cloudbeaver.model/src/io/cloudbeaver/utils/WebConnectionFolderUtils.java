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
package io.cloudbeaver.utils;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebConnectionFolderInfo;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.dbeaver.model.DBPDataSourceFolder;
import org.jkiss.utils.CommonUtils;

public class WebConnectionFolderUtils {

    public static WebConnectionFolderInfo getFolderInfo(WebSession session, String folderPath) throws DBWebException {
        DBPDataSourceFolder folder = null;
        if (!CommonUtils.isEmpty(folderPath)) {
            folder = session.getSingletonProject().getDataSourceRegistry().getFolder(folderPath);
            if (folder == null && (session.hasPermission(DBWConstants.PERMISSION_ADMIN) || session.getApplication().isConfigurationMode())) {
                folder = WebDataSourceUtils.getGlobalDataSourceRegistry().getFolder(folderPath);
            }
        }
        if (folder != null) {
            return new WebConnectionFolderInfo(session, folder);
        } else {
            throw new DBWebException("Folder '" + folderPath + "' not found");
        }
    }
}
