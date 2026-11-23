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

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class KerberosPrincipalMapperTest {

    private static KerberosDelegationSettings settings(String template, String metaParameter) {
        return new KerberosDelegationSettings(
            "HTTP/cloudbeaver.corp.example.com@CORP.EXAMPLE.COM",
            "/etc/cloudbeaver.keytab",
            null,
            null,
            template,
            metaParameter,
            false
        );
    }

    @Test
    void defaultTemplateUsesLocalPartAndRealm() throws DBException {
        assertEquals("jdoe@CORP.EXAMPLE.COM",
            KerberosPrincipalMapper.resolveUserPrincipal(settings(null, null), "jdoe", null));
    }

    @Test
    void localPartStripsDomainPrefixAndSuffix() throws DBException {
        KerberosDelegationSettings settings = settings(null, null);
        assertEquals("jdoe@CORP.EXAMPLE.COM",
            KerberosPrincipalMapper.resolveUserPrincipal(settings, "CORP\\jdoe", null));
        assertEquals("jdoe@CORP.EXAMPLE.COM",
            KerberosPrincipalMapper.resolveUserPrincipal(settings, "jdoe@corp.example.com", null));
        assertEquals("jdoe@CORP.EXAMPLE.COM",
            KerberosPrincipalMapper.resolveUserPrincipal(settings, "  jdoe  ", null));
    }

    @Test
    void realmIsTakenFromServicePrincipalWhenNotConfigured() {
        assertEquals("CORP.EXAMPLE.COM", settings(null, null).getRealm());
    }

    @Test
    void explicitRealmOverridesServicePrincipalRealm() {
        KerberosDelegationSettings settings = new KerberosDelegationSettings(
            "HTTP/cb@CORP.EXAMPLE.COM", "/k", null, "USERS.EXAMPLE.COM", null, null, false);
        assertEquals("USERS.EXAMPLE.COM", settings.getRealm());
    }

    @Test
    void userIdTemplateKeepsFullUserId() throws DBException {
        assertEquals("jdoe@corp.example.com",
            KerberosPrincipalMapper.resolveUserPrincipal(settings("${userId}", null), "jdoe@corp.example.com", null));
    }

    @Test
    void templateWithoutRealmGetsRealmAppended() throws DBException {
        assertEquals("svc-jdoe@CORP.EXAMPLE.COM",
            KerberosPrincipalMapper.resolveUserPrincipal(settings("svc-${userLocalPart}", null), "jdoe", null));
    }

    @Test
    void metaParameterTakesPrecedenceOverTemplate() throws DBException {
        KerberosDelegationSettings settings = settings("${userId}", "userPrincipalName");
        assertEquals("john.doe@CORP.EXAMPLE.COM",
            KerberosPrincipalMapper.resolveUserPrincipal(settings, "jdoe", Map.of("userPrincipalName", "john.doe@CORP.EXAMPLE.COM")));
    }

    @Test
    void missingMetaParameterFails() {
        KerberosDelegationSettings settings = settings(null, "userPrincipalName");
        DBException error = assertThrows(DBException.class,
            () -> KerberosPrincipalMapper.resolveUserPrincipal(settings, "jdoe", Map.of()));
        assertTrue(error.getMessage().contains("userPrincipalName"));
    }

    @Test
    void emptyUserIdFails() {
        assertThrows(DBException.class,
            () -> KerberosPrincipalMapper.resolveUserPrincipal(settings(null, null), " ", null));
        assertThrows(DBException.class,
            () -> KerberosPrincipalMapper.resolveUserPrincipal(settings(null, null), null, null));
    }

    @Test
    void principalWithWhitespaceOrSecondAtSignIsRejected() {
        assertThrows(DBException.class,
            () -> KerberosPrincipalMapper.resolveUserPrincipal(settings("${userId}", null), "j doe@CORP.EXAMPLE.COM", null));
        assertThrows(DBException.class,
            () -> KerberosPrincipalMapper.resolveUserPrincipal(settings("${userId}", null), "jdoe@a@b", null));
    }

    @Test
    void missingRealmFailsForBareUserName() {
        KerberosDelegationSettings settings = new KerberosDelegationSettings(
            "cloudbeaver", "/k", null, null, null, null, false);
        assertThrows(DBException.class,
            () -> KerberosPrincipalMapper.resolveUserPrincipal(settings, "jdoe", null));
    }
}
