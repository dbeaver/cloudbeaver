export const DatabaseDataType = {
  Binary: 'binary',
  Boolean: 'boolean',
  Date: 'date',
  Number: 'number',
  String: 'string',
  Null: 'null',
} as const;
export type DatabaseDataType = (typeof DatabaseDataType)[keyof typeof DatabaseDataType];
