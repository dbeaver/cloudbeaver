/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
package io.cloudbeaver.model.session.monitor;

import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.utils.WebEventUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.ProxyProgressMonitor;

/**
 * Task progress monitor.
 * Used by async GQL requests.
 */
public class TaskProgressMonitor extends ProxyProgressMonitor {

    @NotNull
    private final WebAsyncTaskInfo asyncTask;
    private final WebSession webSession;

    public TaskProgressMonitor(DBRProgressMonitor original, @NotNull WebSession webSession, @NotNull WebAsyncTaskInfo asyncTask) {
        super(original);
        this.webSession = webSession;
        this.asyncTask = asyncTask;
    }

    @Override
    public void beginTask(String name, int totalWork) {
        super.beginTask(name, totalWork);
        asyncTask.setStatus(name);
        WebEventUtils.sendAsyncTaskEvent(webSession, asyncTask);
    }

    @Override
    public void subTask(String name) {
        super.subTask(name);
        asyncTask.setStatus(name);
        WebEventUtils.sendAsyncTaskEvent(webSession, asyncTask);
    }
}