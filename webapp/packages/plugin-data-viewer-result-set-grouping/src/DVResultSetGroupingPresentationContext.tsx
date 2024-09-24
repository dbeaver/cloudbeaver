/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useCaptureViewContext } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_DV_DDM_RS_GROUPING } from './DataContext/DATA_CONTEXT_DV_DDM_RS_GROUPING.js';
import type { IDVResultSetGroupingPresentationState } from './IDVResultSetGroupingPresentationState.js';
import { useGroupingData } from './useGroupingData.js';

interface Props {
  state: IDVResultSetGroupingPresentationState;
}

export const DVResultSetGroupingPresentationContext = observer<Props>(function DVResultSetGroupingPresentationContext({ state }) {
  const grouping = useGroupingData(state);

  useCaptureViewContext((context, id) => {
    context.set(DATA_CONTEXT_DV_DDM_RS_GROUPING, grouping, id);
  });

  return null;
});
