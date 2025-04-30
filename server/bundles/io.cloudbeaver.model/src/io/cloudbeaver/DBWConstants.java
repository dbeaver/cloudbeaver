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
package io.cloudbeaver;

import org.jkiss.dbeaver.model.access.DBAPermissionRealm;
import org.jkiss.dbeaver.model.rm.RMConstants;

/**
 * General constants
 */
public interface DBWConstants {

    String PERMISSION_ADMIN = DBAPermissionRealm.PERMISSION_ADMIN;

    String PERMISSION_CONFIGURATION_MANAGER = RMConstants.PERMISSION_CONFIGURATION_MANAGER;
    String PERMISSION_PRIVATE_PROJECT_ACCESS = "private-project-access";
    String PERMISSION_SECRET_MANAGER = "secret-manager";


    String PERMISSION_EDIT_STRUCTURE = "edit-meta";
    String PERMISSION_EDIT_DATA = "edit-data";

    String STATE_ATTR_SIGN_IN_STATE = "state.signin";
    String WORK_DATA_FOLDER_NAME = ".work-data";

    enum SignInState {
        GLOBAL,
        EMBEDDED
    }
    String TASK_STATUS_FINISHED = "Finished";
    //public static final String PERMISSION_USER = "user";

}
