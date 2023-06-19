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
package io.cloudbeaver.model.rm.local;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMCredentials;

import java.nio.file.Path;

public interface RMFileOperationHandler {

    void projectOpened(@NotNull Path projectPath) throws DBException;

    /**
     * Executed before reading file
     */
    void beforeFileRead(@NotNull Path projectPath, @NotNull Path filePath) throws DBException;

    /**
     * Executed before file modification
     */
    void beforeFileChange(@NotNull Path projectPath, @NotNull Path filePath) throws DBException;

    /**
     * Executed after file modification
     */
    void afterFileChange(
        @NotNull Path projectPath,
        @NotNull Path filePath,
        @Nullable SMCredentials smCredentials
    ) throws DBException;
}
