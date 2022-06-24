package io.cloudbeaver.service.auth;

import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebAuthInfo;
import org.jkiss.dbeaver.model.meta.Property;

import java.util.List;

public class WebAuthStatus {
    private final WebAsyncTaskInfo taskInfo;
    private final String redirectLink;
    private final List<WebAuthInfo> userTokens;

    public WebAuthStatus(WebAsyncTaskInfo taskInfo, String redirectUrl) {
        this.taskInfo = taskInfo;
        this.redirectLink = redirectUrl;
        this.userTokens = null;
    }

    public WebAuthStatus(List<WebAuthInfo> userTokens) {
        this.taskInfo = null;
        this.redirectLink = null;
        this.userTokens = userTokens;
    }

    @Property
    public WebAsyncTaskInfo getTaskInfo() {
        return taskInfo;
    }

    @Property
    public String getRedirectLink() {
        return redirectLink;
    }

    @Property
    public List<WebAuthInfo> getUserTokens() {
        return userTokens;
    }
}
