import type { IResultSetContentValue } from './IResultSetContentValue';

export interface IResultSetBinaryFileValue extends IResultSetContentValue {
  binary: string;
}
