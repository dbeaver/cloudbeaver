/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
import io.cloudbeaver.model.rm.RMNIOTest;
import io.cloudbeaver.model.rm.lock.RMLockTest;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.runner.RunWith;
import org.junit.runners.Suite;

@RunWith(Suite.class)
@Suite.SuiteClasses(
    {
        ConnectionsTest.class,
        SQLQueryTranslatorTest.class,
        AuthenticationTest.class,
        ResourceManagerTest.class,
        RMLockTest.class,
        RMNIOTest.class,
        NoSessionTest.class
    }
)
public class CEServerTestSuite {

    @BeforeClass
    public static void startServer() throws Exception {
        CEAppStarter.startServerIfNotStarted();
    }

    @AfterClass
    public static void shutdownServer() {
        CEAppStarter.shutdownServer();
    }
}
