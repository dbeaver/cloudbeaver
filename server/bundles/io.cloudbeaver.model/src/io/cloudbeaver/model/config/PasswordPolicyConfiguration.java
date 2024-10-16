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
package io.cloudbeaver.model.config;

import org.jkiss.dbeaver.model.meta.Property;

public class PasswordPolicyConfiguration {
    private static final int DEFAULT_MIN_LENGTH = 8;
    private static final int DEFAULT_MIN_DIGITS = 1;
    private static final int DEFAULT_MIN_SPECIAL_CHARACTERS = 0;
    private static final boolean DEFAULT_REQUIRES_UPPER_LOWER_CASE = true;
    private int minLength = DEFAULT_MIN_LENGTH;
    private int minNumberCount = DEFAULT_MIN_DIGITS;
    private int minSymbolCount = DEFAULT_MIN_SPECIAL_CHARACTERS;
    private boolean requireMixedCase = DEFAULT_REQUIRES_UPPER_LOWER_CASE;

    @Property
    public int getMinLength() {
        return minLength;
    }

    @Property
    public int getMinNumberCount() {
        return minNumberCount;
    }

    @Property
    public int getMinSymbolCount() {
        return minSymbolCount;
    }

    @Property
    public boolean isRequireMixedCase() {
        return requireMixedCase;
    }
}
