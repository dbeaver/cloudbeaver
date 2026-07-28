/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { getLocalizedDisplayName } from '@dbeaver/js-helpers';

export const LOCALES = ['en', 'ru', 'zh', 'es', 'fr', 'de', 'ja', 'pt', 'ar', 'hi'];

export const LANGUAGE_OPTIONS = LOCALES.map(locale => getLocalizedDisplayName(locale)).toSorted((a, b) => a.localeCompare(b));

export const LANGUAGE_VALIDATION_REGEX = /^[\p{L}\p{M}\s-]+$/u;
