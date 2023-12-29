import type { IResultSetBinaryFileValue } from './IResultSetBinaryFileValue';
import type { IResultSetContentValue } from './IResultSetContentValue';

export function isResultSetBinaryFileValue(value: IResultSetContentValue): value is IResultSetBinaryFileValue {
  return value.contentType === 'application/octet-stream' && Boolean(value?.binary);
}
