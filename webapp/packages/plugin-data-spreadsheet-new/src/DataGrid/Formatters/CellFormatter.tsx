/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { FormatterProps } from 'react-data-grid';

function valueGetter(rawValue: any) {
  if (rawValue !== null && typeof rawValue === 'object') {
    return JSON.stringify(rawValue);
  }

  return rawValue;
}

function formatValue(rawValue: any) {
  const value = valueGetter(rawValue);

  if (typeof value === 'string' && value.length > 1000) {
    return value.split('').map(v => (v.charCodeAt(0) < 32 ? ' ' : v)).join('');
  }

  if (value === null) {
    return '[null]';
  }

  return String(value);
}

function getClasses(rawValue: any) {
  const classes = [];
  if (rawValue === null) {
    classes.push('cell-null');
  }
  return classes.join(' ');
}

export const CellFormatter: React.FC<FormatterProps> = function CellFormatter({ row, column }) {
  const rawValue = row[column.key];
  const classes = getClasses(rawValue);
  const value = formatValue(rawValue);

  return (
    <cell-formatter as='div' className={`cell-formatter ${classes}`}>
      {value}
    </cell-formatter>
  );
};
