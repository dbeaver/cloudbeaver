/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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
package io.cloudbeaver.service.rm.fs;

import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.fs.DBFFileSystemProvider;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystem;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

public class RMVirtualFileSystemProvider implements DBFFileSystemProvider {
    private static final Log log = Log.getLog(RMVirtualFileSystemProvider.class);

    @Override
    public DBFVirtualFileSystem[] getAvailableFileSystems(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DBPProject project
    ) {
        var session = project.getSessionContext().getPrimaryAuthSpace();
        if (!(session instanceof WebSession)) {
            return new DBFVirtualFileSystem[0];
        }
        WebSession webSession = (WebSession) session;
        WebProjectImpl webProject = webSession.getProjectById(project.getId());
        if (webProject == null) {
            log.warn(String.format("Project %s not found in session %s", project.getId(), webSession.getSessionId()));
            return new DBFVirtualFileSystem[0];
        }
        return new DBFVirtualFileSystem[]{new RMVirtualFileSystem(webSession, webProject.getRmProject())};
    }
}
