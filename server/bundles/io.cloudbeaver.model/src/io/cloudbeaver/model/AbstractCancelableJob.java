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
package io.cloudbeaver.model;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.utils.WebEventUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.runtime.AbstractJob;

public abstract class AbstractCancelableJob extends AbstractJob implements CustomCancelableJob {
    protected AbstractCancelableJob(@NotNull String name) {
        super(name);
    }

    @Override
    public void cancelJob(@NotNull WebSession webSession, @NotNull WebAsyncTaskInfo taskInfo) {
        cancelJob(webSession, taskInfo, "Canceled by the user");
    }

    public void cancelJob(@NotNull WebSession webSession, @NotNull WebAsyncTaskInfo taskInfo, @NotNull String errorMessage) {
        taskInfo.setRunning(false);
        taskInfo.setJobError(new DBException(errorMessage));
        WebEventUtils.sendAsyncTaskEvent(webSession, taskInfo);
    }
}
