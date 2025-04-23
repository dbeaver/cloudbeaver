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

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.runtime.AbstractJob;

/**
 * Web async task info
 */
public class WebAsyncTaskInfo {

    @NotNull
    private final String id;
    @NotNull
    private final String name;
    private boolean running = false;
    private Object result;
    private Object extendedResult;
    private String status;
    private Throwable jobError;

    private AbstractJob job;
    private boolean cancelled = false;

    public WebAsyncTaskInfo(@NotNull String id, @NotNull String name) {
        this.id = id;
        this.name = name;
    }

    @NotNull
    public String getId() {
        return id;
    }

    @NotNull
    public String getName() {
        return name;
    }

    public boolean isRunning() {
        return running;
    }

    public void setRunning(boolean running) {
        this.running = running;
    }

    public Object getTaskResult() {
        return result;
    }

    public Object getResult() {
        return result;
    }

    public void setResult(Object result) {
        this.result = result;
    }

    // Extended results are used by services and never exposed to client directly
    public Object getExtendedResult() {
        return extendedResult;
    }

    public void setExtendedResult(Object extendedResult) {
        this.extendedResult = extendedResult;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public WebServerError getError() {
        return jobError == null ? null : new WebServerError(jobError);
    }

    public Throwable getJobError() {
        return jobError;
    }

    public void setJobError(Throwable jobError) {
        this.jobError = jobError;
    }

    public AbstractJob getJob() {
        return job;
    }

    public void setJob(AbstractJob job) {
        this.job = job;
    }
}
