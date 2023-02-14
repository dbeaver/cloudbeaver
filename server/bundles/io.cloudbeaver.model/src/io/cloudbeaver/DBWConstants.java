/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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
package io.cloudbeaver;

import org.jkiss.dbeaver.model.access.DBAPermissionRealm;

/**
 * General constants
 */
public class DBWConstants {

    public static final String PERMISSION_ADMIN = DBAPermissionRealm.PERMISSION_ADMIN;

    public static final String PERMISSION_CONFIGURATION_MANAGER = "configuration-manager";
    public static final String PERMISSION_PRIVATE_PROJECT_ACCESS = "private-project-access";

    public static final String PERMISSION_EDIT_STRUCTURE = "edit-meta";
    public static final String PERMISSION_EDIT_DATA = "edit-data";

    public static final String STATE_ATTR_SIGN_IN_STATE = "state.signin";

    public static final String USER_PROJECTS_FOLDER = "user-projects";
    public static final String SHARED_PROJECTS_FOLDER = "shared-projects";

    public enum SignInState {
        GLOBAL,
        EMBEDDED
    }

    //public static final String PERMISSION_USER = "user";

}
