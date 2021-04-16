/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export type Layout = 'mixedControls';
export interface ILayoutSizeProps {
  keepSize?: boolean;
  tiny?: boolean;
  small?: boolean;
  medium?: boolean;
  large?: boolean;
  /**
   * Used by components that want to change their size or other styles due to diffrent layout
   */
  layout?: Layout;
  fill?: boolean;
}
