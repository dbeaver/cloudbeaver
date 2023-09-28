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

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.rm.nio.RMNIOFileSystemProvider;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.fs.DBFFileSystemProvider;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystem;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.nio.file.spi.FileSystemProvider;

public class RMVirtualFileSystemProvider implements DBFFileSystemProvider {

    @Nullable
    @Override
    public FileSystemProvider createNioFileSystemProvider(
        @NotNull DBRProgressMonitor monitor,
        @NotNull SMSessionContext sessionContext
    ) throws DBException {
        var session = sessionContext.getPrimaryAuthSpace();
        if (!(session instanceof WebSession)) {
            return null;
        }
        WebSession webSession = (WebSession) session;
        return new RMNIOFileSystemProvider(webSession.getRmController());
    }

    @Override
    public DBFVirtualFileSystem[] getAvailableFileSystems(@NotNull DBRProgressMonitor monitor, @NotNull SMSessionContext sessionContext) {
        var session = sessionContext.getPrimaryAuthSpace();
        if (!(session instanceof WebSession)) {
            return new DBFVirtualFileSystem[0];
        }
        WebSession webSession = (WebSession) session;
        return new RMVirtualFileSystem[]{new RMVirtualFileSystem(webSession)};
    }
}
