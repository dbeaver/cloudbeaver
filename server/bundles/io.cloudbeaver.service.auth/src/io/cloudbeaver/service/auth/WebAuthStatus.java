package io.cloudbeaver.service.auth;

import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebAuthInfo;
import org.jkiss.dbeaver.model.meta.Property;

import java.util.List;

public class WebAuthStatus {
    private final WebAsyncTaskInfo taskInfo;
    private final String redirectUrl;
    private final List<WebAuthInfo> userTokens;

    public WebAuthStatus(WebAsyncTaskInfo taskInfo, String redirectUrl) {
        this.taskInfo = taskInfo;
        this.redirectUrl = redirectUrl;
        this.userTokens = null;
    }

    public WebAuthStatus(List<WebAuthInfo> userTokens) {
        this.taskInfo = null;
        this.redirectUrl = null;
        this.userTokens = userTokens;
    }

    @Property
    public WebAsyncTaskInfo getTaskInfo() {
        return taskInfo;
    }

    @Property
    public String getRedirectUrl() {
        return redirectUrl;
    }

    @Property
    public List<WebAuthInfo> getUserTokens() {
        return userTokens;
    }
}
