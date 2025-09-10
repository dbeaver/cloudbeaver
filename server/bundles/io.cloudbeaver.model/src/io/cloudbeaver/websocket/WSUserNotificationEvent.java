package io.cloudbeaver.websocket;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.session.WSAbstractSessionEvent;

import java.time.LocalDateTime;
import java.util.UUID;

public class WSUserNotificationEvent extends WSAbstractSessionEvent {

    private final String uuid = UUID.randomUUID().toString();
    private final LocalDateTime creationTime = LocalDateTime.now();
    private String title;
    private String message;
    private WSUserNotificationEventType eventNotificationType;

    public WSUserNotificationEvent(
        @NotNull String eventId,
        @Nullable String title,
        @Nullable String message,
        @NotNull WSUserNotificationEventType eventNotificationType
    ) {
        super(eventId, WSConstants.TOPIC_USER_NOTIFICATION);
        this.title = title;
        this.message = message;
        this.eventNotificationType = eventNotificationType;
    }

    public String getUuid() {
        return uuid;
    }

    public LocalDateTime getCreationTime() {
        return creationTime;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getEventNotificationType() {
        return eventNotificationType.name();
    }

    public void setEventNotificationType(WSUserNotificationEventType eventNotificationType) {
        this.eventNotificationType = eventNotificationType;
    }
}
