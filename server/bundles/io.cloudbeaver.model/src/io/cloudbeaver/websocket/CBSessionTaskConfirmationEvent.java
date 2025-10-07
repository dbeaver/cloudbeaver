package io.cloudbeaver.websocket;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.WSClientEvent;

public class CBSessionTaskConfirmationEvent extends WSClientEvent {
    public static final String ID = "cb_client_session_task_confirmation";

    private final String taskId;
    private final boolean confirmed;
    private final boolean skipConfirmations;

    public CBSessionTaskConfirmationEvent(
        @NotNull String taskId,
        boolean confirmed,
        boolean skipConfirmations
    ) {
        super(ID, WSConstants.TOPIC_SESSION_TASK);
        this.taskId = taskId;
        this.confirmed = confirmed;
        this.skipConfirmations = skipConfirmations;
    }

    public String getTaskId() {
        return taskId;
    }

    public boolean isConfirmed() {
        return confirmed;
    }

    public boolean isSkipConfirmations() {
        return skipConfirmations;
    }
}

