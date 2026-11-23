/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package oracle.jdbc;

import org.ietf.jgss.GSSCredential;

import java.sql.Connection;
import java.sql.SQLException;

/**
 * Test stand-in for the Oracle JDBC connection builder interface.
 * Only the members used by the Kerberos delegation opener are declared.
 */
public interface OracleConnectionBuilder {

    OracleConnectionBuilder gssCredential(GSSCredential credential);

    Connection build() throws SQLException;
}
