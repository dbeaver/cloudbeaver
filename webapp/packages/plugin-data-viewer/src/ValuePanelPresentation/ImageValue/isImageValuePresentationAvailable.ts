/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getMIME, isImageFormat, isValidUrl } from '@cloudbeaver/core-utils';

import { isResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import type { IResultSetValue } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';

export function isImageValuePresentationAvailable(value: IResultSetValue) {
  if (isResultSetContentValue(value) && value?.binary) {
    return getMIME(value.binary || '') !== null;
  }
  if (isResultSetContentValue(value) || isResultSetBlobValue(value)) {
    return value?.contentType?.startsWith('image/') ?? false;
  }

  if (typeof value !== 'string') {
    return false;
  }

  return isValidUrl(value) && isImageFormat(value);
}
