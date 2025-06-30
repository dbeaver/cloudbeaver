package io.cloudbeaver.model.apilog;

import org.jkiss.dbeaver.Log;

import java.util.ArrayList;
import java.util.List;

public class ApiCallEventDispatcher {

    private static final Log log = Log.getLog(ApiCallEventDispatcher.class);
    private static final ApiCallEventDispatcher INSTANCE = new ApiCallEventDispatcher();
    private final List<ApiCallEventListener> eventListeners = new ArrayList<>();

    private ApiCallEventDispatcher(){

    }

    public static ApiCallEventDispatcher getInstance() {
        return INSTANCE;
    }

    public void registerListener(ApiCallEventListener listener) {
        eventListeners.add(listener);
    }

    public void dispatchEvent(ApiCallEvent event) {
        for (ApiCallEventListener eventListener : eventListeners) {
            try {
                eventListener.onApiCallEvent(event);
            } catch (Exception e) {
                log.warn("Cannot send API call event to listener " + eventListener.getClass().getName(), e);
            }
        }
    }
}
