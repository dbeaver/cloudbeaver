import type { IResultSetContentValue } from './IResultSetContentValue';

export interface IResultSetBinaryValue extends IResultSetContentValue {
  binary: string;
}
