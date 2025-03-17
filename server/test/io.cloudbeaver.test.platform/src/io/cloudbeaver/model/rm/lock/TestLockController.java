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
package io.cloudbeaver.model.rm.lock;

import io.cloudbeaver.model.app.ServletApplication;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.fs.lock.FileLockController;

import java.nio.file.Path;

public class TestLockController extends FileLockController {
    public TestLockController(ServletApplication application) throws DBException {
        super(application.getApplicationInstanceId());
    }

    public TestLockController(ServletApplication application, int maxTimeout) throws DBException {
        super(application.getApplicationInstanceId(), maxTimeout);
    }

    //avoid mockito access method error
    @Override
    public void awaitingUnlock(@NotNull Path projectLockFile) throws InterruptedException, DBException {
        super.awaitingUnlock(projectLockFile);
    }

    //avoid mockito access method error
    @Override
    public boolean isLocked(@NotNull Path lockFilePath) {
        return super.isLocked(lockFilePath);
    }
}
