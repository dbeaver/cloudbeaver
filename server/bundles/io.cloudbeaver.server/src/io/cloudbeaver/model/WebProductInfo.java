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
package io.cloudbeaver.model;

import io.cloudbeaver.server.CBApplication;
import org.eclipse.core.runtime.IProduct;
import org.eclipse.core.runtime.Platform;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.CommonUtils;

import java.text.DateFormat;
import java.util.Date;

/**
 * Web server configuration
 */
public class WebProductInfo {

    @Property
    public String getId() {
        return CommonUtils.notEmpty(Platform.getProduct().getId());
    }

    @Property
    public String getVersion() {
        return GeneralUtils.getProductVersion().toString();
    }

    @Property
    public String getName() {
        return CommonUtils.notEmpty(Platform.getProduct().getName());
    }

    @Property
    public String getDescription() {
        return CommonUtils.notEmpty(Platform.getProduct().getDescription());
    }

    @Property
    public String getBuildTime() {
        Date buildTime = GeneralUtils.getProductBuildTime();
        if (buildTime == null) {
            buildTime = new Date();
        }
        return DateFormat.getDateInstance(DateFormat.LONG).format(buildTime);
    }

    @Property
    public String getReleaseTime() {
        return DateFormat.getDateInstance(DateFormat.LONG).format(GeneralUtils.getProductReleaseDate());
    }

    @Property
    public String getLicenseInfo() {
        return CBApplication.getInstance().getInfoDetails(new VoidProgressMonitor());
    }

    @Property
    public String getLatestVersionInfo() {
        IProduct product = Platform.getProduct();
        return CommonUtils.notEmpty(product.getProperty("versionUpdateURL"));
    }

}
