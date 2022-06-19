/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

import io.cloudbeaver.server.CBApplication;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.nio.file.Path;

public class PlatformTest {

    @Before
    public void setUp() throws Exception {
    }

    @After
    public void tearDown() throws Exception {
    }

    @Test
    public void testPlatformPresence() {
        try {
            System.out.println("Start CBApplication");
            CBApplication testApp = new CBApplication();
            testApp.start(null);

            System.out.println("APP:: " + GeneralUtils.getProductTitle());
            //CBPlatform.setApplication(testApp);

            Path defaultWorkingFolder = DBWorkbench.getPlatform().getApplication().getDefaultWorkingFolder();
            System.out.println("DBeaver application: " + defaultWorkingFolder);


        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
