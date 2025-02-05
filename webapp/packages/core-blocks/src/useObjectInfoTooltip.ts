/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useTranslate } from './localization/useTranslate.js';

export function useObjectInfoTooltip(connection?: string, catalog?: string, schema?: string, project?: string) {
  const translate = useTranslate();

  let result = '';

  if (connection) {
    result += `${translate('ui_connection')}: ${connection}`;
  }

  if (catalog) {
    result += `\n${translate('ui_catalog')}: ${catalog}`;
  }

  if (schema) {
    result += `\n${translate('ui_schema')}: ${schema}`;
  }

  if (project) {
    result += `\n${translate('ui_project')}: ${project}`;
  }

  return result || undefined;
}
