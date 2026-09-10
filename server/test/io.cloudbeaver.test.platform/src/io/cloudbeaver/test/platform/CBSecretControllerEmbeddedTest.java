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
package io.cloudbeaver.test.platform;

import io.cloudbeaver.app.CEAppStarter;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMCredentials;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.secret.DBSSecretObject;
import org.jkiss.dbeaver.model.secret.DBSSecretValue;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Set;

public class CBSecretControllerEmbeddedTest {
    private static final String TEST_USER_ID = "test";
    private static final DBSSecretObject TEST_OBJECT = new DBSSecretObject() {
        @Override
        public String getProjectId() {
            return "test-project";
        }

        @Override
        public String getSecretObjectId() {
            return "test-object";
        }

        @Override
        public String getSecretObjectType() {
            return "test-type";
        }
    };

    @Test
    public void testPrivateSecretsPersistBetweenControllers() throws DBException {
        String secretId = "ce_private_secret_test";
        DBSSecretController firstController = createController(TEST_USER_ID);
        DBSSecretController secondController = createController(TEST_USER_ID);
        DBSSecretController anotherUserController = createController("another-user");

        try {
            firstController.setPrivateSecretValue(
                TEST_OBJECT,
                new DBSSecretValue(secretId, "Test secret", "secret-value")
            );

            Assertions.assertEquals("secret-value", secondController.getPrivateSecretValue(secretId));
            Assertions.assertNull(anotherUserController.getPrivateSecretValue(secretId));

            secondController.deleteObjectSecrets(TEST_OBJECT);
            Assertions.assertNull(firstController.getPrivateSecretValue(secretId));
        } finally {
            firstController.setPrivateSecretValue(secretId, null);
        }
    }

    private static DBSSecretController createController(String userId) throws DBException {
        SMCredentialsProvider credentialsProvider = () -> new SMCredentials(
            "test-token",
            userId,
            "test-session",
            Set.of()
        );
        return CEAppStarter.getTestApp().getSecretController(
            credentialsProvider,
            DBWorkbench.getPlatform().getWorkspace().getAuthContext()
        );
    }
}
