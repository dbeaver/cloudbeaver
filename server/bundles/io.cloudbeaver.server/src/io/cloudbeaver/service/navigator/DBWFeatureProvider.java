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
package io.cloudbeaver.service.navigator;

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.navigator.DBNNode;

import java.util.List;

/**
 * DBWFeatureProvider
 * This interface is used to provide features for database objects in the context of the CloudBeaver web service.
 * Implementations should return an array of feature strings that describe the capabilities or characteristics of the given object.
 */
public interface DBWFeatureProvider {

    @NotNull
    List<String> getNodeFeatures(@NotNull WebSession webSession, @NotNull DBNNode node);

}
