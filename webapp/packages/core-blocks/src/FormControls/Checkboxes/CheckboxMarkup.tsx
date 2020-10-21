/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { composes, useStyles } from '@cloudbeaver/core-theming';

const checkboxStyles = composes(
  css`
  checkbox {
    composes: theme-checkbox from global;
  }
  checkbox-input {
    composes: theme-checkbox_native-control from global;
  }
  checkbox-background {
    composes: theme-checkbox__background from global;
  }
  checkbox-checkmark {
    composes: theme-checkbox__checkmark from global;
  }
  checkbox-checkmark-path {
    composes: theme-checkbox__checkmark-path from global;
  }
  checkbox-mixedmark {
    composes: theme-checkbox__mixedmark from global;
  }
  checkbox-ripple {
    composes: theme-checkbox__ripple from global;
  }
  `,
  css`
    checkbox-container {
      display: flex;
      align-items: center;
    }
    checkbox-label {
      composes: theme-typography--body2 from global;
      cursor: pointer;
    }
  `
);

const checkboxMod = {
  primary: composes(
    css`
      checkbox {
        composes: theme-checkbox_primary from global;
      }
    `
  ),
};

const checkboxState = {
  disabled: composes(
    css`
      checkbox {
        composes: theme-checkbox--disabled from global;
      }
    `
  ),
  checked: composes(
    css`
      checkbox {
        composes: theme-checkbox--checked from global;
      }
    `
  ),
};

interface ICheckboxMarkupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  indeterminate?: boolean;
}

export const CheckboxMarkup: React.FC<ICheckboxMarkupProps> = function CheckboxMarkup({ label, className, ...rest }) {
  return styled(useStyles(checkboxStyles, checkboxMod.primary, rest.disabled
    && checkboxState.disabled, rest.checked && checkboxState.checked))(
    <checkbox-container className={className} as='div'>
      <checkbox as='div'>
        <checkbox-input as='input' type='checkbox' {...rest} />
        <checkbox-background as='div'>
          <checkbox-checkmark as='svg' viewBox='0 0 24 24'>
            <checkbox-checkmark-path as='path' fill='none' d='M1.73,12.91 8.1,19.28 22.79,4.59' />
          </checkbox-checkmark>
          <checkbox-mixedmark as='div' />
        </checkbox-background>
        <checkbox-ripple as='div' />
      </checkbox>
      {label && rest.id && <checkbox-label as='label' htmlFor={rest.id}>{label}</checkbox-label>}
    </checkbox-container>
  );
};
