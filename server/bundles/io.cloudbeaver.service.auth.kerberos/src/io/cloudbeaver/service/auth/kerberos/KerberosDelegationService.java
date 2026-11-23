/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package io.cloudbeaver.service.auth.kerberos;

import com.sun.security.jgss.ExtendedGSSCredential;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.utils.ServletAppUtils;
import org.ietf.jgss.GSSCredential;
import org.ietf.jgss.GSSException;
import org.ietf.jgss.GSSManager;
import org.ietf.jgss.GSSName;
import org.ietf.jgss.Oid;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;

import javax.security.auth.Subject;
import javax.security.auth.kerberos.KerberosTicket;
import javax.security.auth.login.AppConfigurationEntry;
import javax.security.auth.login.Configuration;
import javax.security.auth.login.LoginContext;
import javax.security.auth.login.LoginException;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.CompletionException;
import java.util.function.Supplier;

/**
 * Holds the CloudBeaver service identity in Kerberos and issues delegated credentials.
 * <p>
 * The service logs in from its keytab (JAAS {@code Krb5LoginModule}) and keeps the resulting subject.
 * For every database connection it performs S4U2Self through
 * {@link ExtendedGSSCredential#impersonate(GSSName)}. The returned credential is handed to the JDBC
 * driver, which performs S4U2Proxy to the database service principal while establishing the connection.
 * Both protocol steps are implemented by the JDK; nothing here talks to the KDC directly.
 */
public class KerberosDelegationService {

    private static final Log log = Log.getLog(KerberosDelegationService.class);

    private static final String JAAS_ENTRY_NAME = "CloudBeaverKerberosDelegation";
    private static final String KRB5_LOGIN_MODULE = "com.sun.security.auth.module.Krb5LoginModule";
    private static final String KRB5_CONF_SYSTEM_PROPERTY = "java.security.krb5.conf";
    private static final String KRB5_MECHANISM_OID = "1.2.840.113554.1.2.2";
    private static final Duration RELOGIN_MARGIN = Duration.ofMinutes(5);

    private static final KerberosDelegationService INSTANCE =
        new KerberosDelegationService(KerberosDelegationService::readApplicationSettings);

    private final Supplier<KerberosDelegationSettings> settingsSupplier;
    private final Oid krb5Mechanism;
    private Subject serviceSubject;
    private KerberosDelegationSettings serviceSettings;

    /**
     * Creates a service with a custom settings source. The shared instance reads the server configuration.
     */
    public KerberosDelegationService(@NotNull Supplier<KerberosDelegationSettings> settingsSupplier) {
        this.settingsSupplier = settingsSupplier;
        try {
            this.krb5Mechanism = new Oid(KRB5_MECHANISM_OID);
        } catch (GSSException e) {
            throw new IllegalStateException("Kerberos mechanism OID is not accepted by the JDK", e);
        }
    }

    @NotNull
    public static KerberosDelegationService getInstance() {
        return INSTANCE;
    }

    /**
     * Returns the current delegation settings.
     */
    @NotNull
    public KerberosDelegationSettings getSettings() {
        return settingsSupplier.get();
    }

    /**
     * Reads the delegation settings from the server configuration.
     */
    @NotNull
    private static KerberosDelegationSettings readApplicationSettings() {
        ServletApplication application = ServletAppUtils.getServletApplication();
        Map<String, Object> config = application == null
            ? null
            : application.getAppConfiguration().getPluginConfig(KerberosDelegationSettings.PLUGIN_ID, false);
        return KerberosDelegationSettings.fromConfig(config);
    }

    /**
     * Obtains a credential which lets the service act on behalf of {@code userPrincipal} (S4U2Self).
     * The caller owns the credential and should dispose it after use.
     */
    @NotNull
    public GSSCredential impersonate(@NotNull String userPrincipal) throws DBException {
        KerberosDelegationSettings settings = getSettings();
        settings.validate();
        Subject subject = getServiceSubject(settings);
        try {
            return Subject.callAs(subject, () -> {
                GSSManager manager = GSSManager.getInstance();
                GSSCredential serviceCredential = manager.createCredential(
                    null, GSSCredential.DEFAULT_LIFETIME, krb5Mechanism, GSSCredential.INITIATE_ONLY);
                if (!(serviceCredential instanceof ExtendedGSSCredential extendedCredential)) {
                    throw new GSSException(GSSException.UNAVAILABLE, -1,
                        "JDK GSS provider does not support impersonation");
                }
                GSSName userName = manager.createName(userPrincipal, GSSName.NT_USER_NAME, krb5Mechanism);
                return extendedCredential.impersonate(userName);
            });
        } catch (CompletionException e) {
            Throwable cause = e.getCause() != null ? e.getCause() : e;
            throw new DBException("Cannot obtain delegated Kerberos credentials for '" + userPrincipal
                + "' as '" + settings.getServicePrincipal() + "': " + cause.getMessage(), cause);
        }
    }

    @NotNull
    private synchronized Subject getServiceSubject(@NotNull KerberosDelegationSettings settings) throws DBException {
        if (serviceSubject != null && settings.equals(serviceSettings) && isServiceTicketFresh(serviceSubject)) {
            return serviceSubject;
        }
        serviceSubject = login(settings);
        serviceSettings = settings;
        return serviceSubject;
    }

    private static boolean isServiceTicketFresh(@NotNull Subject subject) {
        Instant deadline = Instant.now().plus(RELOGIN_MARGIN);
        for (KerberosTicket ticket : subject.getPrivateCredentials(KerberosTicket.class)) {
            if (ticket.isCurrent() && ticket.getEndTime() != null && ticket.getEndTime().toInstant().isAfter(deadline)) {
                return true;
            }
        }
        return false;
    }

    @NotNull
    private static Subject login(@NotNull KerberosDelegationSettings settings) throws DBException {
        applyKrb5Conf(settings.getKrb5Conf());
        Map<String, String> options = new LinkedHashMap<>();
        options.put("useKeyTab", "true");
        options.put("keyTab", settings.getKeytab());
        options.put("principal", settings.getServicePrincipal());
        options.put("storeKey", "false");
        options.put("doNotPrompt", "true");
        options.put("useTicketCache", "false");
        options.put("isInitiator", "true");
        options.put("refreshKrb5Config", "true");
        options.put("debug", String.valueOf(settings.isDebug()));
        AppConfigurationEntry entry = new AppConfigurationEntry(
            KRB5_LOGIN_MODULE,
            AppConfigurationEntry.LoginModuleControlFlag.REQUIRED,
            options
        );
        Configuration configuration = new Configuration() {
            @Override
            public AppConfigurationEntry[] getAppConfigurationEntry(String name) {
                return JAAS_ENTRY_NAME.equals(name) ? new AppConfigurationEntry[]{entry} : null;
            }
        };
        try {
            LoginContext loginContext = new LoginContext(JAAS_ENTRY_NAME, new Subject(), null, configuration);
            loginContext.login();
            log.debug("Kerberos service login succeeded for " + settings.getServicePrincipal());
            return loginContext.getSubject();
        } catch (LoginException e) {
            throw new DBException("Kerberos service login failed for '" + settings.getServicePrincipal()
                + "' using keytab '" + settings.getKeytab() + "': " + e.getMessage(), e);
        }
    }

    private static void applyKrb5Conf(@Nullable String krb5Conf) {
        if (krb5Conf == null) {
            return;
        }
        String current = System.getProperty(KRB5_CONF_SYSTEM_PROPERTY);
        if (current != null && !current.equals(krb5Conf)) {
            log.warn("Replacing " + KRB5_CONF_SYSTEM_PROPERTY + " '" + current + "' with '" + krb5Conf + "'");
        }
        System.setProperty(KRB5_CONF_SYSTEM_PROPERTY, krb5Conf);
    }
}
