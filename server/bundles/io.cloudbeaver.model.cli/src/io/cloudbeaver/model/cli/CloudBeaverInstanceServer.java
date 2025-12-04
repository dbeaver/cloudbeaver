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
package io.cloudbeaver.model.cli;


import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.cli.ApplicationInstanceController;
import org.jkiss.dbeaver.model.cli.ApplicationInstanceServer;
import org.jkiss.dbeaver.model.cli.CLIProcessResult;

import java.io.IOException;

public class CloudBeaverInstanceServer extends ApplicationInstanceServer<ApplicationInstanceController> {
    private final CloudBeaverCommandLine commandLine;

    public CloudBeaverInstanceServer() throws IOException {
        super(ApplicationInstanceController.class);
        this.commandLine = new CloudBeaverCommandLine(null);
    }

    public CloudBeaverInstanceServer(@NotNull CloudBeaverCommandLine commandLine) throws IOException {
        super(ApplicationInstanceController.class);
        this.commandLine = commandLine;
    }

    @NotNull
    @Override
    public CLIProcessResult handleCommandLine(@NotNull String[] args) {
        try {
            return commandLine.executeCommandLineCommands(
                this,
                false,
                false,
                args
            );
        } catch (Exception e) {
            return new CLIProcessResult(CLIProcessResult.PostAction.ERROR, "Error executing command: " + e.getMessage());
        }
    }
}
