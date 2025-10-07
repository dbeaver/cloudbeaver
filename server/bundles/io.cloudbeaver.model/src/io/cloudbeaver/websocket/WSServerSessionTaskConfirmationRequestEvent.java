package io.cloudbeaver.websocket;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.session.WSAbstractSessionEvent;

public class WSServerSessionTaskConfirmationRequestEvent extends WSAbstractSessionEvent {

    public static final String ID = "cb_session_task_confirmation_request";

    private final String title;
    private final String message;

    public WSServerSessionTaskConfirmationRequestEvent(
        @NotNull String title,
        @NotNull
        String message
    ) {
        super(ID, WSConstants.TOPIC_SESSION_TASK);
        this.title = title;
        this.message = message;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }
}
