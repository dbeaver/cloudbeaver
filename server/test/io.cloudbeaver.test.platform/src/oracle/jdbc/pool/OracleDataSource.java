/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package oracle.jdbc.pool;

import oracle.jdbc.OracleConnectionBuilder;
import org.ietf.jgss.GSSCredential;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Test stand-in for the Oracle JDBC data source. Records what the Kerberos delegation opener
 * passes in and returns a scripted result.
 */
public class OracleDataSource {

    public static volatile String lastUrl;
    public static volatile Properties lastProperties;
    public static volatile GSSCredential lastCredential;
    public static volatile Connection connectionToReturn;
    public static volatile SQLException failure;

    private String url;
    private Properties properties;

    public static void reset() {
        lastUrl = null;
        lastProperties = null;
        lastCredential = null;
        connectionToReturn = null;
        failure = null;
    }

    public void setURL(String url) {
        this.url = url;
    }

    public void setConnectionProperties(Properties properties) {
        this.properties = properties;
    }

    public OracleConnectionBuilder createConnectionBuilder() {
        return new OracleConnectionBuilder() {
            private GSSCredential credential;

            @Override
            public OracleConnectionBuilder gssCredential(GSSCredential credential) {
                this.credential = credential;
                return this;
            }

            @Override
            public Connection build() throws SQLException {
                lastUrl = url;
                lastProperties = properties;
                lastCredential = credential;
                if (failure != null) {
                    throw failure;
                }
                return connectionToReturn;
            }
        };
    }
}
