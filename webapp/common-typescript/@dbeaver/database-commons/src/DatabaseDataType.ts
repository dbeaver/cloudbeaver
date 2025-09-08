export const DatabaseDataType = {
  Binary: 'binary',
  Boolean: 'boolean',
  Date: 'date',
  DateTime: 'datetime',
  Time: 'time',
  Number: 'number',
  String: 'string',
  Null: 'null',
} as const;
export type DatabaseDataType = (typeof DatabaseDataType)[keyof typeof DatabaseDataType];
