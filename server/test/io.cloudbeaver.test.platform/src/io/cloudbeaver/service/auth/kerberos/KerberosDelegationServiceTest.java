/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package io.cloudbeaver.service.auth.kerberos;

import org.jkiss.dbeaver.DBException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Exercises the JAAS login path with a keytab and a KDC that cannot be reached.
 * A real KDC is not available in unit tests, so the expectation is a clear failure
 * rather than a credential.
 */
public class KerberosDelegationServiceTest {

    private static final String KRB5_CONF_PROPERTY = "java.security.krb5.conf";

    private String originalKrb5Conf;

    @BeforeEach
    void saveKrb5Conf() {
        originalKrb5Conf = System.getProperty(KRB5_CONF_PROPERTY);
    }

    @AfterEach
    void restoreKrb5Conf() {
        if (originalKrb5Conf == null) {
            System.clearProperty(KRB5_CONF_PROPERTY);
        } else {
            System.setProperty(KRB5_CONF_PROPERTY, originalKrb5Conf);
        }
    }

    @Test
    void settingsComeFromSupplier() {
        KerberosDelegationSettings settings = KerberosDelegationSettings.fromConfig(null);
        KerberosDelegationService service = new KerberosDelegationService(() -> settings);
        assertSame(settings, service.getSettings());
    }

    @Test
    void impersonateFailsClearlyWhenNotConfigured() {
        KerberosDelegationService service = new KerberosDelegationService(() -> KerberosDelegationSettings.fromConfig(null));

        DBException error = assertThrows(DBException.class, () -> service.impersonate("jdoe@CORP.EXAMPLE.COM"));

        assertTrue(error.getMessage().contains(KerberosDelegationSettings.PLUGIN_ID), error.getMessage());
    }

    @Test
    void impersonateReportsServiceLoginFailure(@TempDir Path dir) throws IOException {
        Path keytab = Files.write(dir.resolve("cloudbeaver.keytab"), new byte[]{5, 2, 0, 0, 0, 0});
        Path krb5Conf = Files.writeString(dir.resolve("krb5.conf"), """
            [libdefaults]
                default_realm = CORP.EXAMPLE.INVALID
                dns_lookup_kdc = false
                dns_lookup_realm = false
                udp_preference_limit = 1
                kdc_timeout = 1000
                max_retries = 1
            [realms]
                CORP.EXAMPLE.INVALID = {
                    kdc = 127.0.0.1:1
                }
            """);
        KerberosDelegationSettings settings = new KerberosDelegationSettings(
            "HTTP/cloudbeaver.corp.example.invalid@CORP.EXAMPLE.INVALID",
            keytab.toString(),
            krb5Conf.toString(),
            null,
            null,
            null,
            false
        );
        KerberosDelegationService service = new KerberosDelegationService(() -> settings);

        DBException error = assertThrows(DBException.class, () -> service.impersonate("jdoe@CORP.EXAMPLE.INVALID"));

        assertTrue(error.getMessage().contains("Kerberos service login failed"), error.getMessage());
        assertTrue(error.getMessage().contains("HTTP/cloudbeaver.corp.example.invalid@CORP.EXAMPLE.INVALID"), error.getMessage());
        assertEquals(krb5Conf.toString(), System.getProperty(KRB5_CONF_PROPERTY));
    }

    @Test
    void settingsAreReadOnEveryCall() {
        AtomicReference<KerberosDelegationSettings> current = new AtomicReference<>(KerberosDelegationSettings.fromConfig(null));
        KerberosDelegationService service = new KerberosDelegationService(current::get);
        assertSame(current.get(), service.getSettings());

        KerberosDelegationSettings updated = new KerberosDelegationSettings("HTTP/cb@R", "/k", null, null, null, null, false);
        current.set(updated);
        assertSame(updated, service.getSettings());
    }
}
