/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { TLocalizationToken } from '@cloudbeaver/core-localization';

import type { IMenuItemOptions } from '../models/MenuOptionsStore';
import type { IMenuContext } from './IMenuContext';

/**
 * Options allow to create context menu item
 */
export interface IContextMenuItem<T> extends IMenuItemOptions {
  onClick?: (context: IMenuContext<T>) => void;
  onMouseEnter?: (context: IMenuContext<T>) => void;
  titleGetter?: (context: IMenuContext<T>) => TLocalizationToken | undefined;
  // if isPresent is false menu item will not be included in resulting context menu
  isPresent: (context: IMenuContext<T>) => boolean;
  isDisabled?: (context: IMenuContext<T>) => boolean;
  // When the item is present in menu it can be hidden based on certain conditions
  isHidden?: (context: IMenuContext<T>) => boolean;
  isProcessing?: (context: IMenuContext<T>) => boolean;
  /**
   * @param  {IMenuContext<T>} context
   * Useful when we want to show menu panel based on some async data
   */
  isPanelAvailable?: (context: IMenuContext<T>) => boolean;
  isChecked?: (context: IMenuContext<T>) => boolean;
}
