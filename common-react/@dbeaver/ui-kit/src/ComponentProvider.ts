import { createContext } from 'react';
import type { ButtonBase } from './Button/Button.js';
import type { IconButtonBase } from './IconButton/IconButton.js';
import type { CheckboxBase } from './Checkbox/Checkbox.js';
import type { Radio } from './Radio/Radio.js';
import type { InputBase } from './Input/Input.js';
import type { RadioGroup } from './Radio/RadioGroup.js';
import type { Select } from './Select/Select.js';
import type { SelectField } from './Select/SelectField.js';

export interface IComponentProvider {
  Button?: typeof ButtonBase;
  IconButton?: typeof IconButtonBase;
  Input?: typeof InputBase;
  Checkbox?: typeof CheckboxBase;
  Radio?: typeof Radio;
  RadioGroup?: typeof RadioGroup;
  Select?: typeof Select;
  SelectField?: typeof SelectField;
}
export const ComponentProvider = createContext<IComponentProvider>({});
