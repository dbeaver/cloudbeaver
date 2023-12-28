package io.cloudbeaver.auth;

import org.jkiss.code.NotNull;

import java.util.Map;

public interface BruteforceProtection {
    Object getSupposedUsername(@NotNull Map<String, Object> cred);
}
