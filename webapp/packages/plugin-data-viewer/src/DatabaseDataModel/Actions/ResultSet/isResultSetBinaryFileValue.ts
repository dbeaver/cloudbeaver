import type { IResultSetBinaryFileValue } from './IResultSetBinaryFileValue';

export function isResultSetBinaryFileValue(value: any): value is IResultSetBinaryFileValue {
  return value?.contentType === 'application/octet-stream' && Boolean(value?.binary);
}
