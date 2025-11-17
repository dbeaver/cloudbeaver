/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';
import type { ButtonBase, ButtonBaseIcon } from './Button/Button.js';
import type { IconButtonBase } from './IconButton/IconButton.js';
import type { CheckboxBase } from './Checkbox/Checkbox.js';
import type { Radio } from './Radio/Radio.js';
import type { InputBase } from './Input/Input.js';
import type { RadioGroup } from './Radio/RadioGroup.js';
import type { Select } from './Select/Select.js';
import type { SelectField } from './Select/SelectField.js';
import type { ColorPickerBase } from './ColorPicker/ColorPickerBase.js';

export interface IComponentProvider {
  Button?: typeof ButtonBase;
  ButtonIcon?: typeof ButtonBaseIcon;
  IconButton?: typeof IconButtonBase;
  Input?: typeof InputBase;
  ColorPicker?: typeof ColorPickerBase;
  Checkbox?: typeof CheckboxBase;
  Radio?: typeof Radio;
  RadioGroup?: typeof RadioGroup;
  Select?: typeof Select;
  SelectField?: typeof SelectField;
}
export const ComponentProvider = createContext<IComponentProvider>({});
