/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { ObjectPagePanelProps } from './ObjectPage';

export const DBObjectPagePanel = observer(function DBObjectPagePanel({
  tab,
  page,
}: ObjectPagePanelProps<unknown>) {
  const Panel = page.getPanelComponent();
  return <Panel tab={tab} page={page} />;
});
