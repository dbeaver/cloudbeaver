/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function getLocalizedDisplayName(locale: string, type: Intl.DisplayNamesType = 'language'): string {
  const displayNames = new Intl.DisplayNames([locale], { type });
  const name = displayNames.of(locale);
  if (name) {
    return name.charAt(0).toLocaleUpperCase() + name.slice(1);
  }
  return locale;
}