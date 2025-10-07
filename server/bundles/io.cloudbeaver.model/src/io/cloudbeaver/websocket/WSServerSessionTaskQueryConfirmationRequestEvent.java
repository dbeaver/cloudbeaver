package io.cloudbeaver.websocket;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.session.WSAbstractSessionEvent;

public class WSServerSessionTaskQueryConfirmationRequestEvent extends WSAbstractSessionEvent {

    public static final String ID = "cb_session_task_confirmation_request";

    private final String title;
    private final String message;
    private final String query;

    public WSServerSessionTaskQueryConfirmationRequestEvent(
        @NotNull String title,
        @NotNull String message,
        @NotNull String query
    ) {
        super(ID, WSConstants.TOPIC_SESSION_TASK);
        this.title = title;
        this.message = message;
        this.query = query;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getQuery() {
        return query;
    }
}
