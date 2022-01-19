/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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
package io.cloudbeaver.model;

import org.jkiss.dbeaver.registry.language.PlatformLanguageDescriptor;

/**
 * Web server message
 */
public class WebServerLanguage {

    private PlatformLanguageDescriptor languageDescriptor;

    public WebServerLanguage(PlatformLanguageDescriptor languageDescriptor) {
        this.languageDescriptor = languageDescriptor;
    }

    public String getIsoCode() {
        return languageDescriptor.getCode();
    }

    public String getDisplayName() {
        return languageDescriptor.getLabel();
    }

    public String getNativeName() {
        return languageDescriptor.getLocalizedName(getIsoCode());
    }

    @Override
    public String toString() {
        return getIsoCode();
    }
}
