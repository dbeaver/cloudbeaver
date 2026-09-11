/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Loader } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { AIProfileFormService } from './AIProfileFormService.js';
import { AIProfileFormPanel } from './AIProfileFormPanel.js';

export const AIProfileForm = observer(function AIProfileForm() {
  const aiProfileFormService = useService(AIProfileFormService);

  if (!aiProfileFormService.formState) {
    return null;
  }

  return (
    <Loader suspense>
      <AIProfileFormPanel formState={aiProfileFormService.formState} />
    </Loader>
  );
});
