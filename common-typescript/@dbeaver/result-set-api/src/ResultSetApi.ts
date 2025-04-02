import { DatabaseDataType } from '@dbeaver/database-commons';

export class ResultSetApi {
  static getBooleanValue(value: any): boolean {
    const stringValue = String(value);
    const stringLower = stringValue.toLocaleLowerCase();

    if (stringValue === 'true' || stringLower === '1') {
      return true;
    }
    if (stringValue === 'false' || stringLower === '0') {
      return false;
    }
    return false;
  }

  static getValueType(value: any): DatabaseDataType {
    const stringValue = String(value);
    const stringLower = stringValue.toLocaleLowerCase();

    if (value === null || stringLower === 'null') {
      return DatabaseDataType.Null;
    }

    if (typeof value === 'boolean' || stringLower === 'true' || stringLower === 'false') {
      return DatabaseDataType.Boolean;
    }

    return DatabaseDataType.String;
  }

  static getColumnDataType(column: { dataKind?: string | null }): DatabaseDataType {
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
        return DatabaseDataType.Date;
    }
    return DatabaseDataType.String;
  }
}
