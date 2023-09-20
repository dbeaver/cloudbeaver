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
package io.cloudbeaver.model.rm.fs;

import io.cloudbeaver.BaseWebProjectImpl;
import io.cloudbeaver.model.rm.fs.nio.RMNIOFileSystemProvider;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystem;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystemRoot;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.net.URI;
import java.nio.file.Path;

public class RMVirtualFileSystem implements DBFVirtualFileSystem {
    @NotNull
    private final WebSession webSession;
    private final RMNIOFileSystemProvider rmNioFileSystemProvider;

    public RMVirtualFileSystem(@NotNull WebSession webSession) {
        this.webSession = webSession;
        this.rmNioFileSystemProvider = new RMNIOFileSystemProvider(webSession.getRmController());
    }

    @NotNull
    @Override
    public String getFileSystemDisplayName() {
        return "RM";
    }

    @NotNull
    @Override
    public String getType() {
        return "rm";
    }

    @Override
    public String getDescription() {
        return "Resource Manager file system";
    }

    @Override
    public DBPImage getIcon() {
        return null;
    }

    @NotNull
    @Override
    public String getId() {
        return "rm";
    }

    @NotNull
    @Override
    public DBFVirtualFileSystemRoot[] getRootFolders(DBRProgressMonitor monitor, @NotNull DBPProject project) throws DBException {
        if (!(project instanceof BaseWebProjectImpl)) {
            throw new DBException("Unsupported project type: " + project.getClass().getName());
        }
        BaseWebProjectImpl webProject = (BaseWebProjectImpl) project;
        return new RMVirtualFileSystemRoot[]{new RMVirtualFileSystemRoot(this, webProject.getRmProject())};
    }

    @Override
    public Path getPath(DBRProgressMonitor monitor, @NotNull URI fileUri) throws DBException {
        return rmNioFileSystemProvider.getPath(fileUri);
    }

    @NotNull
    public WebSession getWebSession() {
        return webSession;
    }
}
