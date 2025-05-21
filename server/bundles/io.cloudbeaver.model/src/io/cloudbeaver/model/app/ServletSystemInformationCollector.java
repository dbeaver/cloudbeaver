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

import io.cloudbeaver.auth.NoAuthCredentialsProvider;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPConnectionInformation;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.meta.PropertyGroup;
import org.jkiss.dbeaver.model.meta.PropertyLength;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.dbeaver.utils.SystemVariablesResolver;
import org.jkiss.utils.StandardConstants;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Web system information collector.
 */
public class ServletSystemInformationCollector<T extends ServletApplication> implements DBPObject {

    private enum DeploymentType {
        DEFAULT,
        DOCKER,
        KUBERNETES
    }

    @NotNull
    protected final T application;

    @NotNull
    private final String osInfo;
    @NotNull
    private final String javaVersion;
    @NotNull
    private final String javaParameters;
    @NotNull
    private final String productName;
    @NotNull
    private final String productVersion;
    @NotNull
    private final String memoryAvailable;
    @NotNull
    private final String installPath;
    private DBPConnectionInformation smDatabaseInfo;
    private String workspacePath;
    private final DeploymentType deploymentType;

    public ServletSystemInformationCollector(@NotNull T application) {
        this.application = application;
        this.osInfo = System.getProperty(StandardConstants.ENV_OS_NAME) + " " + System.getProperty(
            StandardConstants.ENV_OS_VERSION) + " (" + System.getProperty(StandardConstants.ENV_OS_ARCH) + ")";
        this.javaVersion = System.getProperty(StandardConstants.ENV_JAVA_VERSION) + " by " + System.getProperty(
            StandardConstants.ENV_JAVA_VENDOR) + " (" + System.getProperty(StandardConstants.ENV_JAVA_ARCH) + "bit)";
        this.javaParameters = System.getProperty("sun.java.command");
        this.productName = GeneralUtils.getProductName();
        this.productVersion = GeneralUtils.getProductVersion().toString();
        this.installPath = SystemVariablesResolver.getInstallPath();
        this.memoryAvailable = "%dMb/%dMb".formatted(
            Runtime.getRuntime().totalMemory() / (1024 * 1024),
            Runtime.getRuntime().maxMemory() / (1024 * 1024)
        );
        deploymentType = checkDeploymentType();
    }

    private DeploymentType checkDeploymentType() {
        if (System.getenv("KUBERNETES_SERVICE_HOST") != null) {
            return DeploymentType.KUBERNETES;
        }
        if (isRunningInDocker()) {
            return DeploymentType.DOCKER;
        }

        return DeploymentType.DEFAULT;
    }

    @NotNull
    @Property(order = 1)
    public String getProductName() {
        return productName;
    }

    @NotNull
    @Property(order = 2)
    public String getProductVersion() {
        return productVersion;
    }

    @NotNull
    @Property(order = 11)
    public String getOsInfo() {
        return osInfo;
    }

    @NotNull
    @Property(order = 12)
    public String getMemoryAvailable() {
        return memoryAvailable;
    }

    @NotNull
    @Property(order = 21, length = PropertyLength.MULTILINE)
    public String getJavaVersion() {
        return javaVersion;
    }

    @NotNull
    @Property(order = 22, length = PropertyLength.MULTILINE)
    public String getJavaParameters() {
        return javaParameters;
    }

    @NotNull
    @Property(order = 23)
    public String getDeploymentType() {
        return deploymentType.name();
    }

    @NotNull
    @PropertyGroup(order = 31, category = "Security manager database", groupId = "sm")
    public DBPConnectionInformation getSmDatabaseInfo() {
        return smDatabaseInfo;
    }

    @Property(order = Integer.MAX_VALUE - 10, length = PropertyLength.MULTILINE)
    public String getWorkspacePath() {
        return workspacePath;
    }

    public void setWorkspacePath(String workspacePath) {
        this.workspacePath = workspacePath;
    }

    @NotNull
    @Property(order = Integer.MAX_VALUE - 10, length = PropertyLength.MULTILINE)
    public String getInstallPath() {
        return installPath;
    }


    /**
     * Collects info about internal databases.
     */
    public void collectInternalDatabaseUseInformation() throws DBException {
        this.smDatabaseInfo = application.getAdminSecurityController(new NoAuthCredentialsProvider())
            .getInternalDatabaseInformation();
    }

    private static boolean isRunningInDocker() {
        Path cgroupPath = Path.of("/.dockerenv");
        return Files.exists(cgroupPath);
    }
}
