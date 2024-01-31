/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
package io.cloudbeaver.model.app;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.secret.DBSSecretControllerAuthorized;

/**
 * Void secret controller.
 */
public class VoidSecretController implements DBSSecretController, DBSSecretControllerAuthorized {

    public static final VoidSecretController INSTANCE = new VoidSecretController();

    public VoidSecretController() {

    }

    @Nullable
    @Override
    public String getPrivateSecretValue(@NotNull String secretId) {
        return null;
    }

    @Override
    public void setPrivateSecretValue(@NotNull String secretId, @Nullable String secretValue) throws DBException {
        throw new DBException("Secret controller is read-only");
    }

    @Override
    public void flushChanges() {
    }

    @Override
    public void authorize(
        @Nullable SMCredentialsProvider credentialsProvider,
        @Nullable SMSessionContext smSessionContext
    ) throws DBException {

    }
}