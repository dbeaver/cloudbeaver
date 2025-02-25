/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { ICellFormatterProps } from './ICellFormatterProps.js';

export const IndexFormatter: React.FC<ICellFormatterProps> = observer(function IndexFormatter({ rowIdx }) {
  return rowIdx + 1;
});
