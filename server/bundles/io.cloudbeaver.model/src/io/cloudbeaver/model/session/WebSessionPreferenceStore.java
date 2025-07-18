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
package io.cloudbeaver.model.session;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.impl.preferences.AbstractUserPreferenceStore;
import org.jkiss.dbeaver.model.preferences.DBPPreferenceStore;

import java.io.IOException;
import java.util.Map;

public class WebSessionPreferenceStore extends AbstractUserPreferenceStore {

    @NotNull
    private final WebUserContext userContext;

    public WebSessionPreferenceStore(
        @NotNull WebUserContext userContext,
        @NotNull DBPPreferenceStore parentStore
    ) {
        super(parentStore);
        this.userContext = userContext;
    }

    @NotNull
    public Map<String, Object> getCustomUserParameters() {
        return userPreferences;
    }

    // to avoid redundant sm api call
    public void updatePreferenceValues(@NotNull Map<String, Object> newValues) throws DBException {
        if (userContext.getUser() != null) {
            userContext.getSecurityController().setCurrentUserParameters(newValues);
        }
        for (Map.Entry<String, Object> entry : newValues.entrySet()) {
            if (entry.getValue() == null) {
                userPreferences.remove(entry.getKey());
            } else {
                userPreferences.put(entry.getKey(), entry.getValue());
            }
        }
    }

    @Override
    protected void setUserPreference(String name, Object value) {
        throw new RuntimeException("Not implemented");
    }

    @Override
    public String getDefaultString(String name) {
        return parentStore.getDefaultString(name);
    }

    @Override
    public boolean isDefault(String name) {
        return !userPreferences.containsKey(name) && parentStore.isDefault(name);
    }

    @Override
    public boolean needsSaving() {
        return false;
    }

    @Override
    public void setToDefault(String name) {
        throw new RuntimeException("Not implemented");
    }

    @Override
    public void save() throws IOException {
        throw new RuntimeException("Not implemented");
    }
}
