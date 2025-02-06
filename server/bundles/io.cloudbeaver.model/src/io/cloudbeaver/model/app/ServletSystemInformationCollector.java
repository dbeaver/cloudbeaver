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
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.StandardConstants;

/**
 * Web system information collector.
 */
public class ServletSystemInformationCollector implements DBPObject {

    @NotNull
    private final String osInfo;
    @NotNull
    private final String javaVersion;
    @NotNull
    private final String javaParameters;
    @NotNull
    private final String productVersion;
    private String workspacePath;

    public ServletSystemInformationCollector() {
        this.osInfo = System.getProperty(StandardConstants.ENV_OS_NAME) + " " + System.getProperty(
            StandardConstants.ENV_OS_VERSION) + " (" + System.getProperty(StandardConstants.ENV_OS_ARCH) + ")";
        this.javaVersion = System.getProperty(StandardConstants.ENV_JAVA_VERSION) + " by " + System.getProperty(
            StandardConstants.ENV_JAVA_VENDOR) + " (" + System.getProperty(StandardConstants.ENV_JAVA_ARCH) + "bit)";
        this.javaParameters = System.getProperty("sun.java.command");
        this.productVersion = GeneralUtils.getProductVersion().toString();
    }

    @NotNull
    @Property
    public String getOsInfo() {
        return osInfo;
    }

    @NotNull
    @Property
    public String getJavaVersion() {
        return javaVersion;
    }

    @NotNull
    @Property
    public String getJavaParameters() {
        return javaParameters;
    }

    @NotNull
    @Property
    public String getProductVersion() {
        return productVersion;
    }

    @Property
    public String getWorkspacePath() {
        return workspacePath;
    }

    public void setWorkspacePath(String workspacePath) {
        this.workspacePath = workspacePath;
    }
}
