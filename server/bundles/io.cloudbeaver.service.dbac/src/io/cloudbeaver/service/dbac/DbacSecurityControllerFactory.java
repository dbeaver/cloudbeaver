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
package io.cloudbeaver.service.dbac;

import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.app.ServletAuthApplication;
import io.cloudbeaver.model.config.WebDatabaseConfig;
import io.cloudbeaver.service.dbac.db.DbacSchema;
import io.cloudbeaver.service.security.EmbeddedSecurityControllerFactory;
import io.cloudbeaver.service.security.db.CBDatabase;

/**
 * Security controller factory which additionally registers the fork-owned DBAC schema module.
 * <p>
 * Only {@link #makeDatabase} is overridden: the CloudBeaver CE schema config is still added first by
 * {@code CBDatabase}, so CE initialization order and behaviour are unchanged, and the DBAC schema is
 * applied afterwards as a separate module. Initialization failures keep propagating from
 * {@code createAndInitDatabaseInstance}, so the server does not continue in a partially initialized
 * state.
 */
public class DbacSecurityControllerFactory<T extends ServletAuthApplication>
    extends EmbeddedSecurityControllerFactory<T> {

    @Override
    protected CBDatabase makeDatabase(ServletApplication application, WebDatabaseConfig databaseConfig) {
        return new CBDatabase(application, databaseConfig, DbacSchema.getSchemaConfigs());
    }
}
