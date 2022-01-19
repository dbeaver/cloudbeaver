/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ISplitState, SplitContext } from 'go-split';
import { useContext } from 'react';

export function useSplit(): ISplitState {
  return useContext(SplitContext);
}
