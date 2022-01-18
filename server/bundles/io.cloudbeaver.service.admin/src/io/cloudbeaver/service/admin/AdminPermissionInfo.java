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
package io.cloudbeaver.service.admin;

import io.cloudbeaver.registry.WebPermissionDescriptor;

/**
 * Web permission ID
 */
public class AdminPermissionInfo {

    private final WebPermissionDescriptor permission;

    public AdminPermissionInfo(WebPermissionDescriptor permission) {
        this.permission = permission;
    }

    public String getId() {
        return permission.getId();
    }

    public String getLabel() {
        return permission.getLabel();
    }

    public String getDescription() {
        return permission.getDescription();
    }

    public String getCategory() {
        return permission.getCategory();
    }

}
