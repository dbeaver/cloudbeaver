package io.cloudbeaver.model;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.utils.WebEventUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.runtime.AbstractJob;

public abstract class AbstractCancelableJob extends AbstractJob implements CustomCancelableJob{
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
