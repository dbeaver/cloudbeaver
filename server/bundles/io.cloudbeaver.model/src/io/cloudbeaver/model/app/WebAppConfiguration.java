package io.cloudbeaver.model.app;

public interface WebAppConfiguration {
    String getAnonymousUserRole();

    boolean isAnonymousAccessEnabled();

    <T> T getResourceQuota(String quotaId);
}
