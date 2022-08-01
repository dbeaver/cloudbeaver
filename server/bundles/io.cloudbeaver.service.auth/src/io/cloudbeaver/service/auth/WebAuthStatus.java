package io.cloudbeaver.service.auth;

import io.cloudbeaver.model.session.WebAuthInfo;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.meta.Property;

import java.util.List;

public class WebAuthStatus {
    private final String authId;
    private final String redirectLink;
    private final SMAuthStatus authStatus;
    private final List<WebAuthInfo> userTokens;

    public WebAuthStatus(String authId, String redirectUrl, SMAuthStatus authStatus) {
        this.authId = authId;
        this.redirectLink = redirectUrl;
        this.authStatus = authStatus;
        this.userTokens = null;
    }

    public WebAuthStatus(SMAuthStatus authStatus, List<WebAuthInfo> userTokens) {
        this.authStatus = authStatus;
        this.authId = null;
        this.redirectLink = null;
        this.userTokens = userTokens;
    }

    @Property
    public String getAuthId() {
        return authId;
    }

    @Property
    public String getRedirectLink() {
        return redirectLink;
    }

    @Property
    public List<WebAuthInfo> getUserTokens() {
        return userTokens;
    }

    @Property
    public SMAuthStatus getAuthStatus() {
        return authStatus;
    }
}
