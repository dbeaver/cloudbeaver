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
import org.jkiss.dbeaver.model.cli.ApplicationInstanceController;
import org.jkiss.dbeaver.model.cli.CLIRunMeta;
import org.jkiss.dbeaver.model.cli.CommandLineContext;
import org.jkiss.dbeaver.model.cli.command.AbstractTopLevelCommand;
import picocli.CommandLine;

@CommandLine.Command(name = "cbvr", description = "CloudBeaver commands")
public class CloudBeaverTopLevelCommand extends AbstractTopLevelCommand {
    @CommandLine.Option(
        names = {NOSPASH_OPTION},
        hidden = true,
        scope = CommandLine.ScopeType.INHERIT
    )
    private boolean noSplash;

    protected CloudBeaverTopLevelCommand(
        @Nullable ApplicationInstanceController controller,
        @NotNull CommandLineContext context,
        @NotNull CLIRunMeta meta

    ) {
        super(controller, context, meta);
    }
}
