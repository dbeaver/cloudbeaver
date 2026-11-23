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
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.utils.CommonUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Objects;

/**
 * Server-wide Kerberos delegation settings.
 * <p>
 * Read from the {@code app.plugins.kerberos-delegation} section of the server configuration:
 * <pre>
 * plugins: {
 *     "kerberos-delegation": {
 *         servicePrincipal: "HTTP/cloudbeaver.corp.example.com@CORP.EXAMPLE.COM",
 *         keytab: "/opt/cloudbeaver/conf/cloudbeaver.keytab",
 *         krb5Conf: "/opt/cloudbeaver/conf/krb5.conf",
 *         realm: "CORP.EXAMPLE.COM",
 *         userPrincipalTemplate: "${userLocalPart}@${realm}"
 *     }
 * }
 * </pre>
 */
public class KerberosDelegationSettings {

    public static final String PLUGIN_ID = "kerberos-delegation";

    public static final String PROP_SERVICE_PRINCIPAL = "servicePrincipal";
    public static final String PROP_KEYTAB = "keytab";
    public static final String PROP_KRB5_CONF = "krb5Conf";
    public static final String PROP_REALM = "realm";
    public static final String PROP_USER_PRINCIPAL_TEMPLATE = "userPrincipalTemplate";
    public static final String PROP_USER_PRINCIPAL_META_PARAMETER = "userPrincipalMetaParameter";
    public static final String PROP_DEBUG = "debug";

    public static final String DEFAULT_USER_PRINCIPAL_TEMPLATE =
        KerberosPrincipalMapper.VAR_USER_LOCAL_PART + "@" + KerberosPrincipalMapper.VAR_REALM;

    private final String servicePrincipal;
    private final String keytab;
    private final String krb5Conf;
    private final String realm;
    private final String userPrincipalTemplate;
    private final String userPrincipalMetaParameter;
    private final boolean debug;

    public KerberosDelegationSettings(
        @Nullable String servicePrincipal,
        @Nullable String keytab,
        @Nullable String krb5Conf,
        @Nullable String realm,
        @Nullable String userPrincipalTemplate,
        @Nullable String userPrincipalMetaParameter,
        boolean debug
    ) {
        this.servicePrincipal = CommonUtils.nullIfEmpty(CommonUtils.trim(servicePrincipal));
        this.keytab = CommonUtils.nullIfEmpty(CommonUtils.trim(keytab));
        this.krb5Conf = CommonUtils.nullIfEmpty(CommonUtils.trim(krb5Conf));
        String explicitRealm = CommonUtils.nullIfEmpty(CommonUtils.trim(realm));
        this.realm = explicitRealm != null ? explicitRealm : extractRealm(this.servicePrincipal);
        String template = CommonUtils.nullIfEmpty(CommonUtils.trim(userPrincipalTemplate));
        this.userPrincipalTemplate = template != null ? template : DEFAULT_USER_PRINCIPAL_TEMPLATE;
        this.userPrincipalMetaParameter = CommonUtils.nullIfEmpty(CommonUtils.trim(userPrincipalMetaParameter));
        this.debug = debug;
    }

    @NotNull
    public static KerberosDelegationSettings fromConfig(@Nullable Map<String, Object> config) {
        if (config == null) {
            config = Map.of();
        }
        return new KerberosDelegationSettings(
            JSONUtils.getString(config, PROP_SERVICE_PRINCIPAL),
            JSONUtils.getString(config, PROP_KEYTAB),
            JSONUtils.getString(config, PROP_KRB5_CONF),
            JSONUtils.getString(config, PROP_REALM),
            JSONUtils.getString(config, PROP_USER_PRINCIPAL_TEMPLATE),
            JSONUtils.getString(config, PROP_USER_PRINCIPAL_META_PARAMETER),
            JSONUtils.getBoolean(config, PROP_DEBUG, false)
        );
    }

    @Nullable
    private static String extractRealm(@Nullable String principal) {
        if (principal == null) {
            return null;
        }
        int atIndex = principal.lastIndexOf('@');
        if (atIndex < 0 || atIndex == principal.length() - 1) {
            return null;
        }
        return principal.substring(atIndex + 1);
    }

    /**
     * True when the administrator supplied at least one delegation property.
     */
    public boolean isConfigured() {
        return servicePrincipal != null || keytab != null;
    }

    /**
     * Checks that every property needed to log the service in and map users is present.
     */
    public void validate() throws DBException {
        if (servicePrincipal == null) {
            throw new DBException("Kerberos delegation is not configured: set '" + PROP_SERVICE_PRINCIPAL
                + "' in the '" + PLUGIN_ID + "' plugin configuration");
        }
        if (keytab == null) {
            throw new DBException("Kerberos delegation is not configured: set '" + PROP_KEYTAB
                + "' in the '" + PLUGIN_ID + "' plugin configuration");
        }
        if (!Files.isReadable(Path.of(keytab))) {
            throw new DBException("Kerberos keytab '" + keytab + "' is missing or not readable");
        }
        if (krb5Conf != null && !Files.isReadable(Path.of(krb5Conf))) {
            throw new DBException("Kerberos configuration '" + krb5Conf + "' is missing or not readable");
        }
        if (realm == null) {
            throw new DBException("Kerberos delegation is not configured: set '" + PROP_REALM
                + "' or use a service principal with a realm");
        }
    }

    @Nullable
    public String getServicePrincipal() {
        return servicePrincipal;
    }

    @Nullable
    public String getKeytab() {
        return keytab;
    }

    @Nullable
    public String getKrb5Conf() {
        return krb5Conf;
    }

    @Nullable
    public String getRealm() {
        return realm;
    }

    @NotNull
    public String getUserPrincipalTemplate() {
        return userPrincipalTemplate;
    }

    @Nullable
    public String getUserPrincipalMetaParameter() {
        return userPrincipalMetaParameter;
    }

    public boolean isDebug() {
        return debug;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof KerberosDelegationSettings that)) {
            return false;
        }
        return debug == that.debug
            && Objects.equals(servicePrincipal, that.servicePrincipal)
            && Objects.equals(keytab, that.keytab)
            && Objects.equals(krb5Conf, that.krb5Conf)
            && Objects.equals(realm, that.realm)
            && Objects.equals(userPrincipalTemplate, that.userPrincipalTemplate)
            && Objects.equals(userPrincipalMetaParameter, that.userPrincipalMetaParameter);
    }

    @Override
    public int hashCode() {
        return Objects.hash(servicePrincipal, keytab, krb5Conf, realm, userPrincipalTemplate, userPrincipalMetaParameter, debug);
    }
}
