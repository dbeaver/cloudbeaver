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
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.websocket.event.session.WSSessionSubTaskInfoEvent;
import org.jkiss.dbeaver.model.websocket.event.session.WSSessionTaskInfoEvent;

import java.util.ArrayList;
import java.util.List;

/**
 * Task progress monitor with events.
 * Can be used if we need to show a progress info in UI using web sockets.
 */
public class TaskWithEventsProgressMonitor extends TaskProgressMonitor {
    private static final Log log = Log.getLog(TaskWithEventsProgressMonitor.class);
    private final WebSession webSession;
    private final List<ProgressState> states = new ArrayList<>();

    public TaskWithEventsProgressMonitor(
        DBRProgressMonitor original,
        @NotNull WebSession webSession,
        @NotNull WebAsyncTaskInfo asyncTask
    ) {
        super(original, asyncTask);
        this.webSession = webSession;
    }

    @Override
    public void beginTask(String name, int totalWork) {
        super.beginTask(name, totalWork);
        ProgressState progressState = new ProgressState(states.size(), name, totalWork);
        states.add(progressState);
        webSession.addSessionEvent(WSSessionTaskInfoEvent.start(progressState.id, name, progressState.totalWork));
    }

    @Override
    public void subTask(String name) {
        super.subTask(name);
        if (states.isEmpty()) {
            log.trace(new DBCException("Progress sub task without start"));
        } else {
            ProgressState progressState = states.get(states.size() - 1);
            progressState.subTask = name;
            webSession.addSessionEvent(WSSessionSubTaskInfoEvent.start(progressState.id, name));
        }
    }

    @Override
    public void worked(int work) {
        super.worked(work);
        if (states.isEmpty()) {
            log.trace(new DBCException("Progress info without start"));
        } else {
            ProgressState progressState = states.get(states.size() - 1);
            progressState.progress += work;
            webSession.addSessionEvent(WSSessionSubTaskInfoEvent.finish(progressState.id, progressState.subTask));
        }
    }

    @Override
    public void done() {
        if (states.isEmpty()) {
            log.trace(new DBCException("Progress ended without start"));
        } else {
            ProgressState progressState = states.get(states.size() - 1);
            states.remove(states.size() - 1);
            webSession.addSessionEvent(WSSessionTaskInfoEvent.finish(progressState.id));
        }
        super.done();
        // Restore previous state
        if (!states.isEmpty()) {
            ProgressState lastState = states.remove(states.size() - 1);
            super.beginTask(lastState.taskName, lastState.totalWork);
            if (lastState.subTask != null) {
                super.subTask(lastState.subTask);
            }
            if (lastState.progress > 0) {
                super.worked(lastState.progress);
            }
        }
    }

    private static class ProgressState {
        final String taskName;
        final int id;
        final int totalWork;
        int progress;
        String subTask;

        ProgressState(int id, String taskName, int totalWork) {
            this.id = id;
            this.taskName = taskName;
            this.totalWork = totalWork;
        }
    }
}