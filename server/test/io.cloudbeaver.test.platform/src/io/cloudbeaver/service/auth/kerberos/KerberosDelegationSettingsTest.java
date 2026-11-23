/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package io.cloudbeaver.service.auth.kerberos;

import org.jkiss.dbeaver.DBException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class KerberosDelegationSettingsTest {

    @Test
    void emptyConfigIsNotConfigured() {
        KerberosDelegationSettings settings = KerberosDelegationSettings.fromConfig(null);
        assertFalse(settings.isConfigured());
        assertNull(settings.getRealm());
        assertEquals(KerberosDelegationSettings.DEFAULT_USER_PRINCIPAL_TEMPLATE, settings.getUserPrincipalTemplate());
        DBException error = assertThrows(DBException.class, settings::validate);
        assertTrue(error.getMessage().contains(KerberosDelegationSettings.PLUGIN_ID));
    }

    @Test
    void configIsParsed(@TempDir Path dir) throws IOException, DBException {
        Path keytab = Files.writeString(dir.resolve("cb.keytab"), "");
        Path krb5Conf = Files.writeString(dir.resolve("krb5.conf"), "[libdefaults]\n");
        Map<String, Object> config = new HashMap<>();
        config.put(KerberosDelegationSettings.PROP_SERVICE_PRINCIPAL, " HTTP/cb.corp.example.com@CORP.EXAMPLE.COM ");
        config.put(KerberosDelegationSettings.PROP_KEYTAB, keytab.toString());
        config.put(KerberosDelegationSettings.PROP_KRB5_CONF, krb5Conf.toString());
        config.put(KerberosDelegationSettings.PROP_USER_PRINCIPAL_TEMPLATE, "${userLocalPart}@USERS.EXAMPLE.COM");
        config.put(KerberosDelegationSettings.PROP_DEBUG, true);

        KerberosDelegationSettings settings = KerberosDelegationSettings.fromConfig(config);
        assertTrue(settings.isConfigured());
        assertEquals("HTTP/cb.corp.example.com@CORP.EXAMPLE.COM", settings.getServicePrincipal());
        assertEquals("CORP.EXAMPLE.COM", settings.getRealm());
        assertEquals("${userLocalPart}@USERS.EXAMPLE.COM", settings.getUserPrincipalTemplate());
        assertNull(settings.getUserPrincipalMetaParameter());
        assertTrue(settings.isDebug());
        assertDoesNotThrow(settings::validate);
    }

    @Test
    void missingKeytabFileFailsValidation(@TempDir Path dir) {
        Map<String, Object> config = Map.of(
            KerberosDelegationSettings.PROP_SERVICE_PRINCIPAL, "HTTP/cb@CORP.EXAMPLE.COM",
            KerberosDelegationSettings.PROP_KEYTAB, dir.resolve("missing.keytab").toString()
        );
        DBException error = assertThrows(DBException.class, () -> KerberosDelegationSettings.fromConfig(config).validate());
        assertTrue(error.getMessage().contains("missing.keytab"));
    }

    @Test
    void servicePrincipalWithoutRealmRequiresExplicitRealm(@TempDir Path dir) throws IOException {
        Path keytab = Files.writeString(dir.resolve("cb.keytab"), "");
        Map<String, Object> config = Map.of(
            KerberosDelegationSettings.PROP_SERVICE_PRINCIPAL, "HTTP/cb",
            KerberosDelegationSettings.PROP_KEYTAB, keytab.toString()
        );
        DBException error = assertThrows(DBException.class, () -> KerberosDelegationSettings.fromConfig(config).validate());
        assertTrue(error.getMessage().contains(KerberosDelegationSettings.PROP_REALM));
    }

    @Test
    void settingsEqualityCoversAllProperties() {
        KerberosDelegationSettings a = new KerberosDelegationSettings("p@R", "/k", null, null, null, null, false);
        KerberosDelegationSettings b = new KerberosDelegationSettings("p@R", "/k", null, null, null, null, false);
        KerberosDelegationSettings c = new KerberosDelegationSettings("p@R", "/k2", null, null, null, null, false);
        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
        assertFalse(a.equals(c));
    }
}
