/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { ObjectPagePanelComponent } from './ObjectPage';

export const DBObjectPagePanel: ObjectPagePanelComponent = observer(function DBObjectPagePanel({
  tab,
  page,
}) {
  const Panel = page.getPanelComponent();
  return <Panel tab={tab} page={page} />;
});
