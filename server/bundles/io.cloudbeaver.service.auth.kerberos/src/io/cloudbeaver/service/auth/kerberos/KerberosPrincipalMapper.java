/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package io.cloudbeaver.service.auth.kerberos;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.utils.CommonUtils;

import java.util.Map;
import java.util.regex.Pattern;

/**
 * Maps the signed-in CloudBeaver user to the Kerberos principal that will be impersonated.
 * <p>
 * The mapping is driven only by administrator configuration. The user never chooses the
 * principal, otherwise any signed-in user could impersonate any other account.
 */
public final class KerberosPrincipalMapper {

    public static final String VAR_USER_ID = "${userId}";
    public static final String VAR_USER_LOCAL_PART = "${userLocalPart}";
    public static final String VAR_REALM = "${realm}";

    private static final Pattern PRINCIPAL_PATTERN = Pattern.compile("^[^@\\s/]+(?:/[^@\\s/]+)?@[^@\\s]+$");

    private KerberosPrincipalMapper() {
    }

    /**
     * Resolves the principal for a user.
     *
     * @param settings       delegation settings (template, realm, meta parameter name)
     * @param userId         CloudBeaver user id, for example {@code jdoe}, {@code jdoe@corp.example.com}
     *                       or {@code CORP\jdoe}
     * @param metaParameters user meta parameters as filled by the authentication provider, may be null
     */
    @NotNull
    public static String resolveUserPrincipal(
        @NotNull KerberosDelegationSettings settings,
        @Nullable String userId,
        @Nullable Map<String, String> metaParameters
    ) throws DBException {
        if (CommonUtils.isEmptyTrimmed(userId)) {
            throw new DBException("Kerberos delegation requires a signed-in user");
        }
        String principal;
        String metaParameter = settings.getUserPrincipalMetaParameter();
        if (metaParameter != null) {
            String value = metaParameters == null ? null : metaParameters.get(metaParameter);
            if (CommonUtils.isEmptyTrimmed(value)) {
                throw new DBException("User '" + userId + "' has no '" + metaParameter
                    + "' attribute, so no Kerberos principal can be delegated");
            }
            principal = value.trim();
        } else {
            principal = settings.getUserPrincipalTemplate()
                .replace(VAR_USER_ID, userId.trim())
                .replace(VAR_USER_LOCAL_PART, getLocalPart(userId))
                .replace(VAR_REALM, CommonUtils.notEmpty(settings.getRealm()))
                .trim();
        }
        if (principal.indexOf('@') < 0) {
            if (CommonUtils.isEmpty(settings.getRealm())) {
                throw new DBException("Kerberos realm is not configured for principal '" + principal + "'");
            }
            principal = principal + "@" + settings.getRealm();
        }
        if (!PRINCIPAL_PATTERN.matcher(principal).matches()) {
            throw new DBException("Resolved Kerberos principal '" + principal + "' is not valid for user '" + userId + "'");
        }
        return principal;
    }

    /**
     * Strips a {@code DOMAIN\} prefix and an {@code @domain} suffix from a user id.
     */
    @NotNull
    public static String getLocalPart(@NotNull String userId) {
        String result = userId.trim();
        int backslash = result.lastIndexOf('\\');
        if (backslash >= 0) {
            result = result.substring(backslash + 1);
        }
        int at = result.indexOf('@');
        if (at >= 0) {
            result = result.substring(0, at);
        }
        return result;
    }
}
