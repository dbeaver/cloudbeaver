/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getMIME, isImageFormat, isValidUrl } from '@cloudbeaver/core-utils';

import { isResultSetBinaryValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBinaryValue.js';
import { isResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue.js';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue.js';
import type { IResultSetValue } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction.js';

export function isImageValuePresentationAvailable(value: IResultSetValue) {
  let contentType = null;

  if (isResultSetBinaryValue(value)) {
    contentType = getMIME(value.binary);
  } else if (isResultSetContentValue(value) || isResultSetBlobValue(value)) {
    contentType = value?.contentType ?? null;
  }

  if (contentType?.startsWith('image/')) {
    return true;
  }

  if (typeof value !== 'string') {
    return false;
  }

  return isValidUrl(value) && isImageFormat(value);
}
