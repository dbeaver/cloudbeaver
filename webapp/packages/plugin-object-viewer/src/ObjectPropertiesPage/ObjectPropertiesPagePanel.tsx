/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useS } from '@cloudbeaver/core-blocks';

import type { ObjectPagePanelComponent } from '../ObjectPage/ObjectPage.js';
import { ObjectFolders } from './ObjectFolders.js';
import classes from './ObjectPropertiesPagePanel.module.css';

export const ObjectPropertiesPagePanel: ObjectPagePanelComponent = observer(function ObjectPropertiesPagePanel({ tab }) {
  const styles = useS(classes);

  return (
    <div className={s(styles, { wrapper: true })}>
      <ObjectFolders tab={tab} />
    </div>
  );
});
