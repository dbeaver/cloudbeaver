/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package io.cloudbeaver.service.auth.kerberos;

import org.jkiss.dbeaver.model.access.DBAAuthCredentials;

/**
 * Credentials of the delegated Kerberos auth model.
 * <p>
 * Intentionally empty: the identity comes from the signed-in web user and the server configuration,
 * so there is nothing for the user to enter or for the server to store.
 */
public class OracleKerberosDelegationCredentials implements DBAAuthCredentials {

    @Override
    public boolean isComplete() {
        return true;
    }
}
