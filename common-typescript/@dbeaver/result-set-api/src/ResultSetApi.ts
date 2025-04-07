import { DatabaseDataType } from '@dbeaver/database-commons';

export class ResultSetApi {
  static getDateValue(value: any): Date | null {
    if (value === null) {
      return null;
    }
    const stringValue = String(value);
    return new Date(stringValue);
  }

  static getNumberValue(value: any): number | null {
    if (value === null) {
      return null;
    }

    const stringValue = String(value);

    const parsedValue = parseFloat(stringValue);
    return isNaN(parsedValue) ? 0 : parsedValue;
  }

  static getBooleanValue(value: any): boolean | null {
    if (value === null) {
      return null;
    }

    const stringValue = String(value);
    const stringLower = stringValue.toLowerCase();

    if (stringValue === 'true' || stringLower === '1') {
      return true;
    }
    if (stringValue === 'false' || stringLower === '0') {
      return false;
    }
    return false;
  }

  static getNullableValue(value: any): any {
    const stringValue = String(value);
    const stringLower = stringValue.toLowerCase();
    if (stringLower === 'null') {
      return null;
    }

    return value;
  }

  static getValueDataType(value: any, columnDataType?: DatabaseDataType): DatabaseDataType {
    const stringValue = String(value);
    const stringLower = stringValue.toLowerCase();

    if (value === null || stringLower === 'null') {
      return DatabaseDataType.Null;
    }

    if (typeof value === 'boolean' || stringLower === 'true' || stringLower === 'false') {
      return DatabaseDataType.Boolean;
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
