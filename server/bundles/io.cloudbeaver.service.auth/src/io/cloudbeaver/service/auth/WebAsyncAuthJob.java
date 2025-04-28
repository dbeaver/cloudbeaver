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

import io.cloudbeaver.model.CustomCancelableJob;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.utils.WebEventUtils;
import org.eclipse.core.runtime.IStatus;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.util.List;

public class WebAsyncAuthJob extends AbstractJob implements CustomCancelableJob {
    @NotNull
    private final String authId;
    private final boolean linkWithUser;
    //result from task do used, because it cannot be serialized into 'object' gql type and separate request is used
    //to get auth result
    @Nullable
    private List<WebAuthInfo> authResult;

    public WebAsyncAuthJob(@NotNull String name, @NotNull String authId, boolean linkWithUser) {
        super(name);
        this.authId = authId;
        this.linkWithUser = linkWithUser;
    }

    //do nothing, this job is workaround to use exist async process
    @Override
    protected IStatus run(DBRProgressMonitor monitor) {
        return null;
    }

    @NotNull
    public String getAuthId() {
        return authId;
    }

    public boolean isLinkWithUser() {
        return linkWithUser;
    }

    @Nullable
    public List<WebAuthInfo> getAuthResult() {
        return authResult;
    }

    public void setAuthResult(@Nullable List<WebAuthInfo> authResult) {
        this.authResult = authResult;
    }

    @Override
    public void cancelJob(@NotNull WebSession webSession, @NotNull WebAsyncTaskInfo taskInfo) {
        taskInfo.setRunning(false);
        taskInfo.setJobError(new DBException("Canceled by the user"));
        WebEventUtils.sendAsyncTaskEvent(webSession, taskInfo);
    }
}
