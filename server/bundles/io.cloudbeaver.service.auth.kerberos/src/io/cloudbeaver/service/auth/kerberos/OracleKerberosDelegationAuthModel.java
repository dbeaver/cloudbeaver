/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package io.cloudbeaver.service.auth.kerberos;

import io.cloudbeaver.model.session.WebSessionWorkspace;
import io.cloudbeaver.model.user.WebUser;
import org.ietf.jgss.GSSCredential;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.access.DBAAuthModel;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.util.Properties;

/**
 * Oracle authentication through Kerberos constrained delegation.
 * <p>
 * The database session runs as the signed-in CloudBeaver user. The server impersonates that user
 * with its own service identity (S4U2Self) and the Oracle driver forwards the resulting credential
 * to the database (S4U2Proxy). Active Directory must allow the service account to delegate to the
 * Oracle service principal, and the database must accept Kerberos logins.
 */
public class OracleKerberosDelegationAuthModel implements DBAAuthModel<OracleKerberosDelegationCredentials> {

    public static final String ID = "oracle_kerberos_delegated";

    public static final String PROP_AUTHENTICATION_SERVICES = "oracle.net.authentication_services";
    public static final String PROP_MUTUAL_AUTHENTICATION = "oracle.net.kerberos5_mutual_authentication";
    public static final String AUTHENTICATION_SERVICES_KERBEROS = "(KERBEROS5)";

    private static final Log log = Log.getLog(OracleKerberosDelegationAuthModel.class);

    private final KerberosDelegationService delegationService;

    public OracleKerberosDelegationAuthModel() {
        this(KerberosDelegationService.getInstance());
    }

    /**
     * Creates a model bound to a specific delegation service. The extension registry uses the default constructor.
     */
    public OracleKerberosDelegationAuthModel(@NotNull KerberosDelegationService delegationService) {
        this.delegationService = delegationService;
    }

    @Override
    public boolean isCredentialsPromptRequired() {
        return false;
    }

    @NotNull
    @Override
    public OracleKerberosDelegationCredentials createCredentials() {
        return new OracleKerberosDelegationCredentials();
    }

    @NotNull
    @Override
    public OracleKerberosDelegationCredentials loadCredentials(
        @NotNull DBPDataSourceContainer dataSource,
        @NotNull DBPConnectionConfiguration configuration
    ) {
        return createCredentials();
    }

    @Override
    public void saveCredentials(
        @NotNull DBPDataSourceContainer dataSource,
        @NotNull DBPConnectionConfiguration configuration,
        @NotNull OracleKerberosDelegationCredentials credentials
    ) {
        // Nothing to store: the identity is derived from the web session
    }

    @Override
    public Object initAuthentication(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DBPDataSource dataSource,
        @NotNull OracleKerberosDelegationCredentials credentials,
        @NotNull DBPConnectionConfiguration configuration,
        @NotNull Properties connProperties
    ) throws DBException {
        DBPDataSourceContainer container = dataSource.getContainer();
        collectConnectionProperties(container, credentials, configuration, connProperties, true);
        String userPrincipal = resolveUserPrincipal(container);
        GSSCredential delegatedCredential = delegationService.impersonate(userPrincipal);
        log.debug("Opening connection '" + container.getName() + "' with delegated Kerberos credentials of " + userPrincipal);
        return new OracleGssConnectionOpener(delegatedCredential);
    }

    @Override
    public void collectConnectionProperties(
        @NotNull DBPDataSourceContainer dataSourceContainer,
        @NotNull OracleKerberosDelegationCredentials credentials,
        @NotNull DBPConnectionConfiguration configuration,
        @NotNull Properties properties,
        boolean collectSecuredProps
    ) {
        properties.put(PROP_AUTHENTICATION_SERVICES, AUTHENTICATION_SERVICES_KERBEROS);
        properties.put(PROP_MUTUAL_AUTHENTICATION, "true");
        properties.remove(DBConstants.DATA_SOURCE_PROPERTY_USER);
        properties.remove(DBConstants.DATA_SOURCE_PROPERTY_PASSWORD);
    }

    @Override
    public void endAuthentication(
        @NotNull DBPDataSourceContainer dataSource,
        @NotNull DBPConnectionConfiguration configuration,
        @NotNull Properties connProperties
    ) {
        // The delegated credential is disposed by the connection opener
    }

    @Override
    public void refreshCredentials(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DBPDataSourceContainer dataSource,
        @NotNull DBPConnectionConfiguration configuration,
        @NotNull OracleKerberosDelegationCredentials credentials
    ) {
        // Credentials are obtained on every connection
    }

    @NotNull
    private String resolveUserPrincipal(@NotNull DBPDataSourceContainer container) throws DBException {
        DBPWorkspace workspace = container.getProject().getWorkspace();
        if (!(workspace instanceof WebSessionWorkspace webWorkspace)) {
            throw new DBException("Kerberos delegation is available only for web session connections");
        }
        WebUser user = webWorkspace.getWebSession().getUserContext().getUser();
        if (user == null) {
            throw new DBException("Kerberos delegation requires a signed-in user");
        }
        KerberosDelegationSettings settings = delegationService.getSettings();
        return KerberosPrincipalMapper.resolveUserPrincipal(settings, user.getUserId(), user.getMetaParameters());
    }
}
