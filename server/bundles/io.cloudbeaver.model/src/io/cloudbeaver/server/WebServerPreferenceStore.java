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
package io.cloudbeaver.server;

import io.cloudbeaver.utils.ServletAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.impl.preferences.AbstractPreferenceStore;
import org.jkiss.dbeaver.model.preferences.DBPPreferenceStore;

import java.io.IOException;
import java.util.Map;

public class WebServerPreferenceStore extends AbstractPreferenceStore {
    private final DBPPreferenceStore parentStore;

    public WebServerPreferenceStore(
        @NotNull DBPPreferenceStore parentStore
    ) {
        this.parentStore = parentStore;
    }

    @Override
    public boolean contains(String name) {
        return productConf().containsKey(name) || parentStore.contains(name);
    }

    @Override
    public boolean getBoolean(String name) {
        return toBoolean(getString(name));
    }

    @Override
    public double getDouble(String name) {
        return toDouble(getString(name));
    }

    @Override
    public float getFloat(String name) {
        return toFloat(getString(name));
    }

    @Override
    public int getInt(String name) {
        return toInt(getString(name));
    }

    @Override
    public long getLong(String name) {
        return toLong(getString(name));
    }

    @Override
    public String getString(String name) {
        Object value = productConf().get(name);
        if (value == null) {
            return parentStore.getString(name);
        }
        return value.toString();
    }

    @Override
    public boolean getDefaultBoolean(String name) {
        return getBoolean(name);
    }

    @Override
    public double getDefaultDouble(String name) {
        return getDouble(name);
    }

    @Override
    public float getDefaultFloat(String name) {
        return getFloat(name);
    }

    @Override
    public int getDefaultInt(String name) {
        return getInt(name);
    }

    @Override
    public long getDefaultLong(String name) {
        return getLong(name);
    }

    @Override
    public String getDefaultString(String name) {
        // TODO: split product.conf and runtime.product.conf
        return getString(name);
    }

    @Override
    public boolean isDefault(String name) {
        return true;
    }

    @Override
    public boolean needsSaving() {
        return false;
    }

    @Override
    public void setDefault(String name, double value) {
        setDefault(name, String.valueOf(value));
    }

    @Override
    public void setDefault(String name, float value) {
        setDefault(name, String.valueOf(value));
    }

    @Override
    public void setDefault(String name, int value) {
        setDefault(name, String.valueOf(value));
    }

    @Override
    public void setDefault(String name, long value) {
        setDefault(name, String.valueOf(value));
    }

    @Override
    public void setDefault(String name, String defaultObject) {
        // do not store global default properties in product.conf
        this.parentStore.setDefault(name, defaultObject);
    }

    @Override
    public void setDefault(String name, boolean value) {
        setDefault(name, String.valueOf(value));
    }

    @Override
    public void setToDefault(String name) {
        parentStore.setToDefault(name);
    }

    @Override
    public void setValue(String name, double value) {
        parentStore.setValue(name, value);
    }

    @Override
    public void setValue(String name, float value) {
        parentStore.setValue(name, value);
    }

    @Override
    public void setValue(String name, int value) {
        parentStore.setValue(name, value);
    }

    @Override
    public void setValue(String name, long value) {
        parentStore.setValue(name, value);
    }

    @Override
    public void setValue(String name, String value) {
        parentStore.setValue(name, value);
    }

    @Override
    public void setValue(String name, boolean value) {
        parentStore.setValue(name, value);
    }

    @Override
    public void save() throws IOException {
        throw new RuntimeException("Not Implemented");
    }

    private Map<String, Object> productConf() {
        var app = ServletAppUtils.getServletApplication();
        return app.getServerConfiguration().getProductSettings();
    }
}
