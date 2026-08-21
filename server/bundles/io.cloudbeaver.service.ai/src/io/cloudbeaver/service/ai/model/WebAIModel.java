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
package io.cloudbeaver.service.ai.model;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.ai.engine.AIModel;
import org.jkiss.dbeaver.model.ai.engine.AIModelFeature;

import java.util.List;

public record WebAIModel(
    @NotNull String id,
    @Nullable Integer contextWindowSize,
    double defaultTemperature,
    @NotNull List<String> features
) {
    public WebAIModel(@NotNull AIModel model) {
        this(
            model.name(),
            model.contextWindowSize(),
            model.defaultTemperature(),
            model.features().stream().map(AIModelFeature::name).toList()
        );
    }
}
