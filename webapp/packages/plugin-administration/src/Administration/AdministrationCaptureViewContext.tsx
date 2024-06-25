/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AdministrationScreenService, DATA_CONTEXT_ADMINISTRATION_ITEM_ROUTE } from '@cloudbeaver/core-administration';
import { useService } from '@cloudbeaver/core-di';
import { useCaptureViewContext } from '@cloudbeaver/core-view';

export const AdministrationCaptureViewContext = observer(function AdministrationCaptureViewContext() {
  const administrationScreenService = useService(AdministrationScreenService);
  const route = administrationScreenService.activeScreen;

  useCaptureViewContext((context, id) => {
    context.set(DATA_CONTEXT_ADMINISTRATION_ITEM_ROUTE, route, id);
  });

  return null;
});
