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
package io.cloudbeaver.service.security.internal;

import io.cloudbeaver.service.security.CBEmbeddedSecurityController;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.utils.GeneralUtils;

public class ClearAuthAttemptInfoJob extends AbstractJob {

    private static final long CHECK_PERIOD = 60 * 60 * 1000;
    private static final long RETRY_PERIOD = 5000;

    private static final Log log = Log.getLog(ClearAuthAttemptInfoJob.class);

    private final CBEmbeddedSecurityController securityController;

    public ClearAuthAttemptInfoJob(CBEmbeddedSecurityController securityController) {
        super("Clear auth attempt info job");
        this.securityController = securityController;
    }

    @Override
    protected IStatus run(DBRProgressMonitor monitor) {
        try {
            securityController.clearOldAuthAttemptInfo();
            schedule(CHECK_PERIOD);
        } catch (DBException e) {
            log.error("Error to clear the auth attempt info: " + GeneralUtils.getRootCause(e).getMessage());
            // Check failed. Re-schedule after 5 seconds
            schedule(RETRY_PERIOD);
        }
        return Status.OK_STATUS;
    }
}
