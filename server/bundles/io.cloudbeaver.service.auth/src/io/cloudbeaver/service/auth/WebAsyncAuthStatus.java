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
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.meta.Property;

public class WebAsyncAuthStatus {
    @NotNull
    private final String redirectLink;

    @NotNull
    private final WebAsyncTaskInfo taskInfo;

    public WebAsyncAuthStatus(@NotNull String redirectLink, @NotNull WebAsyncTaskInfo taskInfo) {
        this.redirectLink = redirectLink;
        this.taskInfo = taskInfo;
    }

    @Property
    @NotNull
    public String getRedirectLink() {
        return redirectLink;
    }

    @NotNull
    @Property
    public WebAsyncTaskInfo getTaskInfo() {
        return taskInfo;
    }
}
