/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.user.SMUserImportList;
import org.jkiss.dbeaver.model.security.user.SMUserProvisioning;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public class AdminImportUsersTest extends CloudbeaverMockTest {
    @Test
    public void importMaintainsProvisionedAuthProviderLifecycle() throws Exception {
        SMAdminController securityController = CEAppStarter.getTestApp().getSecurityController();
        String userId = "import-user-" + UUID.randomUUID();
        var user = new SMUserProvisioning(
            userId,
            Map.of(),
            null
        );
        var importList = new SMUserImportList(
            List.of(user), null, LocalAuthProvider.PROVIDER_ID);

        try {
            Assertions.assertEquals(List.of(user), securityController.importUsers(importList));
            Assertions.assertArrayEquals(
                new String[]{LocalAuthProvider.PROVIDER_ID},
                securityController.getUserLinkedProviders(userId)
            );
            Assertions.assertTrue(
                securityController.getUserCredentials(userId, LocalAuthProvider.PROVIDER_ID).isEmpty()
            );

            Assertions.assertTrue(securityController.importUsers(importList).isEmpty());
            Assertions.assertArrayEquals(
                new String[]{LocalAuthProvider.PROVIDER_ID},
                securityController.getUserLinkedProviders(userId)
            );
            Assertions.assertTrue(
                securityController.getUserCredentials(userId, LocalAuthProvider.PROVIDER_ID).isEmpty()
            );

            securityController.deleteUserCredentials(userId, LocalAuthProvider.PROVIDER_ID);
            Assertions.assertArrayEquals(new String[0], securityController.getUserLinkedProviders(userId));

            Assertions.assertTrue(securityController.importUsers(importList).isEmpty());
            Assertions.assertArrayEquals(
                new String[]{LocalAuthProvider.PROVIDER_ID},
                securityController.getUserLinkedProviders(userId)
            );

            securityController.setUserCredentials(
                userId,
                LocalAuthProvider.PROVIDER_ID,
                Map.of(
                    LocalAuthProvider.CRED_USER, userId,
                    LocalAuthProvider.CRED_PASSWORD, "password"
                )
            );
            Assertions.assertEquals(
                userId,
                securityController.getUserCredentials(userId, LocalAuthProvider.PROVIDER_ID)
                    .get(LocalAuthProvider.CRED_USER)
            );

            Assertions.assertTrue(securityController.importUsers(importList).isEmpty());
            Assertions.assertEquals(
                userId,
                securityController.getUserCredentials(userId, LocalAuthProvider.PROVIDER_ID)
                    .get(LocalAuthProvider.CRED_USER)
            );

            securityController.deleteUserCredentials(userId, LocalAuthProvider.PROVIDER_ID);
            Assertions.assertArrayEquals(new String[0], securityController.getUserLinkedProviders(userId));
        } finally {
            securityController.deleteUser(userId);
        }
    }
}
