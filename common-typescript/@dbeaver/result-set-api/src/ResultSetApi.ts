import { DatabaseDataType } from '@dbeaver/database-commons';
import { isResultSetBinaryValue } from './isResultSetBinaryValue.js';
import { isResultSetContentValue } from './isResultSetContentValue.js';
import { isResultSetComplexValue } from './isResultSetComplexValue.js';

const DISPLAY_STRING_LENGTH = 200;

export class ResultSetApi {
  static truncateText(text: string, length: number): string {
    return text
      .slice(0, length)
      .split('')
      .map(v => (v.charCodeAt(0) < 32 ? ' ' : v))
      .join('');
  }

  static getDateValue(value: unknown): Date | null {
    if (value === null) {
      return null;
    }
    const stringValue = String(value);
    return new Date(stringValue);
  }

  static getNumberValue(value: unknown): number | null {
    if (value === null) {
      return null;
    }

    const stringValue = String(value);

    const parsedValue = parseFloat(stringValue);
    return isNaN(parsedValue) ? 0 : parsedValue;
  }

  static getBooleanValue(value: unknown): boolean | null {
    if (value === null) {
      return null;
    }

    const stringValue = String(value);
    const stringLower = stringValue.toLowerCase();

    if (stringLower === 'true' || stringLower === '1') {
      return true;
    }
    if (stringLower === 'false' || stringLower === '0') {
      return false;
    }
    return false;
  }

  static getNullableValue(value: unknown): unknown | null {
    if (String(value).toLowerCase() === 'null') {
      return null;
    }

    return value;
  }

static getStringFallbackForComplexValue(value: unknown): string  {
  if (isResultSetContentValue(value) && value.text !== undefined) {
      return this.truncateText(String(value.text), DISPLAY_STRING_LENGTH);
  }

  if (isResultSetComplexValue(value) && value.value !== undefined) {
    if (typeof value.value === 'object' && value.value !== null) {
      return JSON.stringify(value.value);
    }

    return String(value.value);
  }
  
  return String(value)
}

  static getValueDataType(value: unknown, columnDataType?: DatabaseDataType): DatabaseDataType {
    const stringValue = String(value);
    const stringLower = stringValue.toLowerCase();

    if (value === null || stringLower === 'null') {
      return DatabaseDataType.Null;
    }

    if (typeof value === 'boolean' || stringLower === 'true' || stringLower === 'false') {
      return DatabaseDataType.Boolean;
    }

    if (typeof value === 'number') {
      return DatabaseDataType.Number;
    }

    if (isResultSetBinaryValue(value)) {
      return DatabaseDataType.Binary;
    }

    return columnDataType ?? DatabaseDataType.String;
  }

  static getColumnDataType(column: { dataKind?: string | null; typeName?: string | null }, valueDataType?: DatabaseDataType): DatabaseDataType {
    const typeName = column.typeName?.toLowerCase();
    switch (column.dataKind?.toLowerCase()) {
      case 'boolean':
        return DatabaseDataType.Boolean;
      case 'binary':
        return DatabaseDataType.Binary;
      case 'numeric':
        return DatabaseDataType.Number;
      case 'string':
        return DatabaseDataType.String;
      case 'datetime':
        switch (typeName) {
          case 'date':
            return DatabaseDataType.Date;
          case 'time':
            return DatabaseDataType.Time;
          default:
            return DatabaseDataType.DateTime;
        }
      case 'date':
        return DatabaseDataType.Date;
      case 'time':
        return DatabaseDataType.Time;
    }
    return valueDataType ?? DatabaseDataType.String;
  }
}
