/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { INavigationTreeUserSettings } from './NavigationTreeSettings/INavigationTreeUserSettings';
import { NavigationTreeSettings } from './NavigationTreeSettings/NavigationTreeSettings';

interface Props {
  root: string;
  settings: INavigationTreeUserSettings;
}

export const ElementsTreeTools = observer<Props>(function ElementsTreeTools({
  root,
  settings,
}) {
  return (
    <tools>
      <NavigationTreeSettings root={root} settings={settings} />
    </tools>
  );
});