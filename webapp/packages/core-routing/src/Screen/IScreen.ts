/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Route } from 'router5';

export type ScreenRoute = Omit<Route, 'children'>

export interface IScreen {
  name: string;
  routes: ScreenRoute[];
  component: ScreenComponent;
  root?: boolean;
  onActivate?: () => void | Promise<void>;
  onDeactivate?: () => void | Promise<void>;
}

export type ScreenComponent = React.FunctionComponent
