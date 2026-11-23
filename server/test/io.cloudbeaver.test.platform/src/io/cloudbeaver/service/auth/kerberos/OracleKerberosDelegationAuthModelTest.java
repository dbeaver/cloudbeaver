/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package io.cloudbeaver.service.auth.kerberos;

import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSessionWorkspace;
import io.cloudbeaver.model.session.WebUserContext;
import io.cloudbeaver.model.user.WebUser;
import org.ietf.jgss.GSSCredential;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Map;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class OracleKerberosDelegationAuthModelTest {

    private static final KerberosDelegationSettings CONFIGURED = new KerberosDelegationSettings(
        "HTTP/cloudbeaver.corp.example.com@CORP.EXAMPLE.COM", "/etc/cloudbeaver.keytab", null, null, null, null, false);

    private final KerberosDelegationService service = Mockito.mock(KerberosDelegationService.class);
    private final OracleKerberosDelegationAuthModel model = new OracleKerberosDelegationAuthModel(service);
    private final DBPDataSourceContainer container = Mockito.mock(DBPDataSourceContainer.class);
    private final DBPDataSource dataSource = Mockito.mock(DBPDataSource.class);
    private final DBPProject project = Mockito.mock(DBPProject.class);
    private final DBPConnectionConfiguration configuration = new DBPConnectionConfiguration();

    @BeforeEach
    void setUp() {
        Mockito.when(dataSource.getContainer()).thenReturn(container);
        Mockito.when(container.getProject()).thenReturn(project);
        Mockito.when(container.getName()).thenReturn("Oracle HR");
        Mockito.when(service.getSettings()).thenReturn(CONFIGURED);
    }

    @Test
    void credentialsAreCompleteAndNeverPrompted() {
        assertFalse(model.isCredentialsPromptRequired());
        assertTrue(model.createCredentials().isComplete());
        assertTrue(model.loadCredentials(container, configuration).isComplete());
    }

    @Test
    void connectionPropertiesEnableKerberosAndDropPassword() {
        Properties properties = new Properties();
        properties.setProperty("user", "scott");
        properties.setProperty("password", "tiger");
        properties.setProperty("v$session.program", "CloudBeaver");

        model.collectConnectionProperties(container, model.createCredentials(), configuration, properties, true);

        assertEquals("(KERBEROS5)", properties.getProperty(OracleKerberosDelegationAuthModel.PROP_AUTHENTICATION_SERVICES));
        assertEquals("true", properties.getProperty(OracleKerberosDelegationAuthModel.PROP_MUTUAL_AUTHENTICATION));
        assertNull(properties.getProperty("user"));
        assertNull(properties.getProperty("password"));
        assertEquals("CloudBeaver", properties.getProperty("v$session.program"));
    }

    @Test
    void initAuthenticationImpersonatesSignedInUser() throws Exception {
        WebUser user = Mockito.mock(WebUser.class);
        Mockito.when(user.getUserId()).thenReturn("CORP\\jdoe");
        Mockito.when(user.getMetaParameters()).thenReturn(Map.of());
        mockWebWorkspace(user);
        GSSCredential credential = Mockito.mock(GSSCredential.class);
        Mockito.when(service.impersonate("jdoe@CORP.EXAMPLE.COM")).thenReturn(credential);
        Properties properties = new Properties();

        Object result = model.initAuthentication(new VoidProgressMonitor(), dataSource, model.createCredentials(), configuration, properties);

        assertInstanceOf(OracleGssConnectionOpener.class, result);
        assertEquals("(KERBEROS5)", properties.getProperty(OracleKerberosDelegationAuthModel.PROP_AUTHENTICATION_SERVICES));
        Mockito.verify(service).impersonate("jdoe@CORP.EXAMPLE.COM");
    }

    @Test
    void initAuthenticationUsesMetaParameterWhenConfigured() throws Exception {
        Mockito.when(service.getSettings()).thenReturn(new KerberosDelegationSettings(
            "HTTP/cb@CORP.EXAMPLE.COM", "/k", null, null, null, "userPrincipalName", false));
        WebUser user = Mockito.mock(WebUser.class);
        Mockito.when(user.getUserId()).thenReturn("jdoe");
        Mockito.when(user.getMetaParameters()).thenReturn(Map.of("userPrincipalName", "john.doe@USERS.EXAMPLE.COM"));
        mockWebWorkspace(user);
        Mockito.when(service.impersonate(Mockito.anyString())).thenReturn(Mockito.mock(GSSCredential.class));

        model.initAuthentication(new VoidProgressMonitor(), dataSource, model.createCredentials(), configuration, new Properties());

        Mockito.verify(service).impersonate("john.doe@USERS.EXAMPLE.COM");
    }

    @Test
    void initAuthenticationRejectsNonWebWorkspace() {
        Mockito.when(project.getWorkspace()).thenReturn(Mockito.mock(DBPWorkspace.class));

        DBException error = assertThrows(DBException.class, () -> model.initAuthentication(
            new VoidProgressMonitor(), dataSource, model.createCredentials(), configuration, new Properties()));

        assertTrue(error.getMessage().contains("web session"), error.getMessage());
        Mockito.verifyNoInteractions(service);
    }

    @Test
    void initAuthenticationRejectsAnonymousSession() throws Exception {
        mockWebWorkspace(null);

        DBException error = assertThrows(DBException.class, () -> model.initAuthentication(
            new VoidProgressMonitor(), dataSource, model.createCredentials(), configuration, new Properties()));

        assertTrue(error.getMessage().contains("signed-in"), error.getMessage());
        Mockito.verify(service, Mockito.never()).impersonate(Mockito.anyString());
    }

    @Test
    void impersonationErrorIsPropagated() throws Exception {
        WebUser user = Mockito.mock(WebUser.class);
        Mockito.when(user.getUserId()).thenReturn("jdoe");
        mockWebWorkspace(user);
        Mockito.when(service.impersonate(Mockito.anyString())).thenThrow(new DBException("KDC unreachable"));

        DBException error = assertThrows(DBException.class, () -> model.initAuthentication(
            new VoidProgressMonitor(), dataSource, model.createCredentials(), configuration, new Properties()));

        assertEquals("KDC unreachable", error.getMessage());
    }

    private void mockWebWorkspace(WebUser user) {
        WebSessionWorkspace workspace = Mockito.mock(WebSessionWorkspace.class);
        BaseWebSession session = Mockito.mock(BaseWebSession.class);
        WebUserContext userContext = Mockito.mock(WebUserContext.class);
        Mockito.when(project.getWorkspace()).thenReturn(workspace);
        Mockito.when(workspace.getWebSession()).thenReturn(session);
        Mockito.when(session.getUserContext()).thenReturn(userContext);
        Mockito.when(userContext.getUser()).thenReturn(user);
    }
}
