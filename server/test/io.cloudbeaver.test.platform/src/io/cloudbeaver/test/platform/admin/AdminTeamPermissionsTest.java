/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.cloudbeaver.test.platform.admin;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.dbeaver.DBException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class AdminTeamPermissionsTest extends CloudbeaverMockTest {

    private static final String GQL_SET_SUBJECT_PERMISSIONS = """
        query setSubjectPermissions($subjectId: ID!, $permissions: [ID!]!) {
          result: setSubjectPermissions(subjectId: $subjectId, permissions: $permissions) { id }
        }""";

    @Test
    public void testDefaultAdminTeamPermissionsCannotBeChanged() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(client);
        var controller = CEAppStarter.getTestApp().getSecurityController();
        String teamId = CBConstants.DEFAULT_ADMIN_TEAM;
        Set<String> original = controller.getSubjectPermissions(teamId);

        for (List<String> permissions : List.of(List.<String>of(), List.of("public"))) {
            DBException error = Assertions.assertThrows(DBException.class, () -> client.sendQuery(
                GQL_SET_SUBJECT_PERMISSIONS, Map.of("subjectId", teamId, "permissions", permissions)
            ));
            Assertions.assertEquals("Cannot change permissions for team 'admin'", error.getMessage());
        }
        Assertions.assertEquals(original, controller.getSubjectPermissions(teamId));
    }

    @Test
    public void testLegacyPublicPermissionDoesNotBlockUpdatingTeam() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(client);
        var controller = CEAppStarter.getTestApp().getSecurityController();
        String teamId = "legacy-permissions-" + UUID.randomUUID();
        controller.createTeam(teamId, teamId, null, "test");
        try {
            controller.setSubjectPermissions(teamId, List.of("public"), "test");

            List<Map<String, Object>> result = client.sendQuery(
                GQL_SET_SUBJECT_PERMISSIONS,
                Map.of("subjectId", teamId, "permissions", List.of("public", DBWConstants.PERMISSION_ADMIN))
            );
            Assertions.assertEquals(List.of(Map.of("id", DBWConstants.PERMISSION_ADMIN)), result);
            Assertions.assertEquals(Set.of(DBWConstants.PERMISSION_ADMIN), controller.getSubjectPermissions(teamId));

            DBException unknown = Assertions.assertThrows(DBException.class, () -> client.sendQuery(
                GQL_SET_SUBJECT_PERMISSIONS,
                Map.of("subjectId", teamId, "permissions", List.of("public", "unknown-test-permission"))
            ));
            Assertions.assertEquals("Unknown permission: unknown-test-permission", unknown.getMessage());

            DBException wrongScope = Assertions.assertThrows(DBException.class, () -> client.sendQuery(
                GQL_SET_SUBJECT_PERMISSIONS, Map.of("subjectId", teamId, "permissions", List.of("public", "access"))
            ));
            Assertions.assertTrue(wrongScope.getMessage().startsWith("Unexpected permission scope"), wrongScope.getMessage());
            Assertions.assertEquals(Set.of(DBWConstants.PERMISSION_ADMIN), controller.getSubjectPermissions(teamId));
        } finally {
            controller.deleteTeam(teamId, true);
        }
    }
}
