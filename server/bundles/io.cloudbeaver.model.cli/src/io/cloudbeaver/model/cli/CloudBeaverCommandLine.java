/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
import org.jkiss.dbeaver.model.cli.ApplicationCommandLine;
import org.jkiss.dbeaver.model.cli.ApplicationInstanceController;
import org.jkiss.dbeaver.model.cli.CLIContextImpl;
import org.jkiss.dbeaver.model.cli.CLIRunMeta;
import org.jkiss.dbeaver.model.cli.registry.CLICommandDescriptor;
import picocli.CommandLine;

import java.util.List;

public class CloudBeaverCommandLine extends ApplicationCommandLine<ApplicationInstanceController> {
    private final CloudBeaverMixin mixin;

    public CloudBeaverCommandLine() {
        super();
        this.mixin = new CloudBeaverMixin();
    }

    public CloudBeaverCommandLine(
        @NotNull CloudBeaverMixin mixin
    ) {
        super();
        this.mixin = mixin;
    }

    @Override
    protected CloudBeaverTopLevelCommand createTopLevelCommand(
        @Nullable ApplicationInstanceController applicationInstanceController,
        @NotNull CLIContextImpl context,
        @NotNull CLIRunMeta runMeta
    ) {
        return new CloudBeaverTopLevelCommand(applicationInstanceController, context, runMeta);
    }

    @NotNull
    @Override
    protected CommandLine initCommandLine(
        @Nullable ApplicationInstanceController applicationInstanceController,
        @NotNull CLIContextImpl context,
        @NotNull CLIRunMeta runMeta,
        @NotNull List<CLICommandDescriptor> commandsToExecute
    ) {
        var cmd = super.initCommandLine(applicationInstanceController, context, runMeta, commandsToExecute);
        cmd.addMixin("cloudbeaver", mixin);
        return cmd;
    }
}
