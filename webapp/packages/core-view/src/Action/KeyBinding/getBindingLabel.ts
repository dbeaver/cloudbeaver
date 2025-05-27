/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getOSSpecificKeys } from './getCommonAndOSSpecificKeys.js';
import type { IKeyBinding } from './IKeyBinding.js';

export function getBindingLabel(binding: IKeyBinding) {
  let bindingLabel = getOSSpecificKeys(binding) ?? binding.keys;
  if (Array.isArray(bindingLabel)) {
    bindingLabel = bindingLabel[0];
  }

  return bindingLabel?.replace(/\+/g, ' + ').replace(/\b\w/g, letter => letter.toUpperCase());
}
