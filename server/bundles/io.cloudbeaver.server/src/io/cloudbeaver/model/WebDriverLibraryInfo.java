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
package io.cloudbeaver.model;

import io.cloudbeaver.WebServiceUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.connection.DBPDriverLibrary;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.registry.driver.DriverDescriptor;

import java.util.List;

public class WebDriverLibraryInfo {

    @NotNull
    private final DBPDriver driver;
    @NotNull
    private final DBPDriverLibrary driverLibrary;

    public WebDriverLibraryInfo(@NotNull DBPDriver driver, @NotNull DBPDriverLibrary driverLibrary) {
        this.driver = driver;
        this.driverLibrary = driverLibrary;
    }


    @Property
    public String getId() {
        return driverLibrary.getId();
    }

    @Property
    public String getName() {
        return driverLibrary.getDisplayName();
    }

    @Property
    @Nullable
    public List<WebDriverLibraryFileInfo> getLibraryFiles() {
        var libraryFiles = ((DriverDescriptor) driver).getDefaultDriverLoader().getLibraryFiles(driverLibrary);
        if (libraryFiles == null) {
            return null;
        }
        return libraryFiles.stream()
            .map(WebDriverLibraryFileInfo::new)
            .toList();
    }

    @Property
    public String getIcon() {
        return WebServiceUtils.makeIconId(driverLibrary.getIcon());
    }
}
