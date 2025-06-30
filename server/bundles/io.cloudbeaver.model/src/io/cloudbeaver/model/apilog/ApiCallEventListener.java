package io.cloudbeaver.model.apilog;

public interface ApiCallEventListener {

    /**
     * Called when an API call event occurs.
     *
     * @param event the API call event
     */
    void onApiCallEvent(ApiCallEvent event);
}
