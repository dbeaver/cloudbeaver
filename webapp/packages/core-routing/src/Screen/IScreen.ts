/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Route, State as RouterState } from 'router5';

export type ScreenRoute = Omit<Route, 'children'>;

export interface IScreen<T extends Record<string, any> = Record<string, any>> {
  name: string;
  routes: ScreenRoute[];
  component: ScreenComponent<T>;
  root?: boolean;
  onActivate?: (state: RouterState, prevState?: RouterState) => void | Promise<void>;
  onDeactivate?: (state: RouterState, nextState: RouterState) => void | Promise<void>;
  canDeActivate?: (state: RouterState, nextState: RouterState) => boolean | Promise<boolean>;
}

export type ScreenComponent<T = Record<string, any>> = React.FunctionComponent<T>;
