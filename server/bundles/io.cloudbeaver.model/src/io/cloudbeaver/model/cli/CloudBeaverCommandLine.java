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
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.cli.*;
import org.jkiss.dbeaver.model.cli.model.CommandLineAuthenticator;
import picocli.CommandLine;

public class CloudBeaverCommandLine extends ApplicationCommandLine<ApplicationInstanceController> {

    @Nullable
    private final CommandLineAuthenticator authenticator;

    public CloudBeaverCommandLine(@Nullable CommandLineAuthenticator authenticator) {
        super();
        this.authenticator = authenticator;
    }

    @Override
    protected CloudBeaverTopLevelCommand createTopLevelCommand(
        @Nullable ApplicationInstanceController applicationInstanceController,
        @NotNull CommandLineContext context,
        @NotNull CLIRunMeta runMeta
    ) {
        if (authenticator != null) {
            context.setContextParameter(CLIConstants.CONTEXT_PARAM_AUTHENTICATOR, authenticator);
        }
        return new CloudBeaverTopLevelCommand(applicationInstanceController, context, runMeta);
    }

    @NotNull
    @Override
    protected CommandLine initCommandLine(
        @Nullable ApplicationInstanceController applicationInstanceController,
        @NotNull CommandLineContext context,
        @NotNull CLIRunMeta runMeta
    ) {
        return super.initCommandLine(applicationInstanceController, context, runMeta);
    }
}
