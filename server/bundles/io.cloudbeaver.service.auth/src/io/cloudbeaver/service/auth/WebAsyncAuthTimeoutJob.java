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
package io.cloudbeaver.service.auth;

import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebSession;
import org.eclipse.core.runtime.IProgressMonitor;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.eclipse.core.runtime.jobs.Job;
import org.jkiss.code.NotNull;

public class WebAsyncAuthTimeoutJob extends Job {
    @NotNull
    private final WebSession webSession;
    @NotNull
    private final WebAsyncTaskInfo asyncInfo;
    @NotNull
    private final WebAsyncAuthJob authJob;

    public WebAsyncAuthTimeoutJob(@NotNull WebSession webSession, @NotNull WebAsyncTaskInfo asyncInfo, @NotNull WebAsyncAuthJob authJob) {
        super("Auth timeout job for " + asyncInfo.getName());
        this.webSession = webSession;
        this.asyncInfo = asyncInfo;
        this.authJob = authJob;
    }


    @NotNull
    @Override
    protected IStatus run(@NotNull IProgressMonitor monitor) {
        if (asyncInfo.isRunning()) {
            authJob.cancelJob(webSession, asyncInfo, "Authentication timeout exceeded");
        }
        return Status.OK_STATUS;
    }
}
