/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package io.cloudbeaver.test.platform;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.service.auth.kerberos.OracleKerberosDelegationAuthModel;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

/**
 * Checks that the running CE server exposes the delegated Kerberos auth model for Oracle.
 */
public class KerberosDelegationAuthModelTest extends CloudbeaverMockTest {

    private static final String GQL_AUTH_MODELS = """
        query authModels {
          result: authModels {
            id
            displayName
            description
            requiresLocalConfiguration
            requiredAuth
            properties {
              id
            }
          }
        }""";

    private static final String GQL_ORACLE_DRIVER = """
        query driverList {
          result: driverList(id: "oracle:oracle_thin") {
            id
            defaultAuthModel
            applicableAuthModels
          }
        }""";

    @Test
    public void delegatedKerberosModelIsListed() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(client);

        List<Map<String, Object>> authModels = client.sendQuery(GQL_AUTH_MODELS, null);
        Map<String, Object> model = authModels.stream()
            .filter(m -> OracleKerberosDelegationAuthModel.ID.equals(JSONUtils.getString(m, "id")))
            .findFirst()
            .orElseThrow(() -> new AssertionError("Auth model '" + OracleKerberosDelegationAuthModel.ID + "' is not registered"));

        Assertions.assertEquals("Kerberos (delegated login)", JSONUtils.getString(model, "displayName"));
        Assertions.assertFalse(JSONUtils.getBoolean(model, "requiresLocalConfiguration"));
        Assertions.assertNull(model.get("requiredAuth"));
        Assertions.assertTrue(JSONUtils.getObjectList(model, "properties").isEmpty(),
            "Delegated model must not ask the user for credentials");
    }

    @Test
    public void delegatedKerberosModelAppliesToOracleThinDriverOnly() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(client);

        List<Map<String, Object>> drivers = client.sendQuery(GQL_ORACLE_DRIVER, null);
        Assertions.assertEquals(1, drivers.size());
        Map<String, Object> oracle = drivers.get(0);
        List<String> applicable = JSONUtils.getStringList(oracle, "applicableAuthModels");
        Assertions.assertTrue(applicable.contains(OracleKerberosDelegationAuthModel.ID), applicable.toString());
        Assertions.assertEquals("oracle_native", JSONUtils.getString(oracle, "defaultAuthModel"),
            "Delegation must stay opt-in");
    }
}
