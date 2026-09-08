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
package io.cloudbeaver.model.fs;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystem;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.navigator.fs.DBNPathBase;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.nio.file.InvalidPathException;
import java.nio.file.Path;

public class WebFSUtils {
    @NotNull
    public static Path resolveSafeChild(@NotNull Path parent, @NotNull String childName) throws DBException {
        if (childName.isBlank()
            || ".".equals(childName)
            || "..".equals(childName)
            || childName.indexOf('/') >= 0
            || childName.indexOf('\\') >= 0
            || (childName.length() >= 2
                && Character.isLetter(childName.charAt(0))
                && childName.charAt(1) == ':')
        ) {
            throw new DBException("Invalid file name");
        }

        try {
            Path child = Path.of(childName);
            if (child.isAbsolute() || child.getNameCount() != 1) {
                throw new DBException("Invalid file name");
            }
            Path normalizedParent = parent.normalize();
            Path resolvedChild = normalizedParent.resolve(child).normalize();
            if (!resolvedChild.startsWith(normalizedParent)) {
                throw new DBException("Invalid file name");
            }
            return resolvedChild;
        } catch (InvalidPathException e) {
            throw new DBException("Invalid file name", e);
        }
    }

    @NotNull
    public static String makeUniqueFsId(@NotNull DBFVirtualFileSystem fileSystem) {
        return fileSystem.getType() + "://" + fileSystem.getId();
    }

    @NotNull
    public static Path getPathFromNode(@NotNull WebSession webSession, @NotNull String nodePath) throws DBException {
        DBNPathBase dbnPath = getNodeByPath(webSession, nodePath);
        Path path = dbnPath.getPath();
        if (path == null) {
            throw new DBWebException("Path from node '" + nodePath + "' is empty");
        }
        return path;
    }

    @NotNull
    public static DBNPathBase getNodeByPath(@NotNull WebSession webSession, @NotNull String nodePath) throws DBException {
        DBRProgressMonitor monitor = webSession.getProgressMonitor();

        DBNModel navigatorModel = webSession.getNavigatorModelOrThrow();
        DBNNode node = navigatorModel.getNodeByPath(monitor, nodePath);
        if (!(node instanceof DBNPathBase dbnPath)) {
            throw new DBWebException("Node '" + nodePath + "' is not found in File Systems");
        }
        return dbnPath;
    }
}
