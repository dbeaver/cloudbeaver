/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

export interface IRadioGroupContext {
  value: string | number | undefined;
  name: string;
  onChange: (value: string| number) => any;
}

export const RadioGroupContext = createContext<IRadioGroupContext | undefined>(undefined);
