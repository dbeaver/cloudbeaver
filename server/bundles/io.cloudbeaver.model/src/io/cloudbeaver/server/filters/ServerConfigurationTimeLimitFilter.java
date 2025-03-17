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

package io.cloudbeaver.server.filters;

import graphql.execution.instrumentation.InstrumentationContext;
import graphql.execution.instrumentation.InstrumentationState;
import graphql.execution.instrumentation.SimpleInstrumentationContext;
import graphql.execution.instrumentation.SimplePerformantInstrumentation;
import graphql.execution.instrumentation.parameters.InstrumentationValidationParameters;
import graphql.validation.ValidationError;
import io.cloudbeaver.model.app.ServletApplication;
import org.jkiss.dbeaver.Log;

import java.time.Duration;
import java.util.List;

public class ServerConfigurationTimeLimitFilter extends SimplePerformantInstrumentation {
    private static final Log log = Log.getLog(ServerConfigurationTimeLimitFilter.class);

    private static final int MINUTES_OF_INACTION_BEFORE_DISABLING_REQUEST_PROCESSING = 60;
    private final ServletApplication application;

    public ServerConfigurationTimeLimitFilter(ServletApplication application) {
        this.application = application;
    }

    @Override
    public InstrumentationContext<List<ValidationError>> beginValidation(
        InstrumentationValidationParameters parameters,
        InstrumentationState state
    ) {
        boolean isOutOfTime = System.currentTimeMillis() - application.getApplicationStartTime()
            > Duration.ofMinutes(MINUTES_OF_INACTION_BEFORE_DISABLING_REQUEST_PROCESSING).toMillis();
        if (application.isConfigurationMode() && isOutOfTime) {
            log.warn("Server configuration time has expired. A server restart is required to continue.");
            ValidationError error = ValidationError.newValidationError()
                .description("Server configuration time has expired. A server restart is required to continue.")
                .build();
            return new SimpleInstrumentationContext<>() {
                @Override
                public void onCompleted(List<ValidationError> result, Throwable t) {
                    result.clear();
                    result.add(error);
                }
            };
        }
        return super.beginValidation(parameters, state);
    }
}
