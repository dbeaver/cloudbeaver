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
