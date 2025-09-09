package io.cloudbeaver.model.session;

public interface WebTopicActivityListener {

    void handelStartSubscriptionTopic(BaseWebSession session);

    String getTopicName();
}
