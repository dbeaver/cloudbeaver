/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export type LocalizationTemplate = (
  args?: Record<string | number, any>
) => string;

export function createTemplate(template: string): (
  args?: Record<string | number, any>
) => string {
  return new Function( 'args', 'return `' + template + '`' ) as LocalizationTemplate;
}