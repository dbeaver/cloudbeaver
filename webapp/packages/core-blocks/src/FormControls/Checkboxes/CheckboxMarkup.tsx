/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useLayoutEffect, useRef } from 'react';
import styled, { css } from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { s } from '../../s';
import { useS } from '../../useS';
import { useStyles } from '../../useStyles';
import CheckboxMarkupStyles from './CheckboxMarkup.m.css';

export type CheckboxMod = 'primary' | 'surface' | 'small';

const checkboxStyles = css`
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
  checkbox-container {
    display: flex;
    align-items: center;
  }
  checkbox-label {
    composes: theme-typography--body2 from global;
    cursor: pointer;
  }
  checkbox-caption {
    composes: theme-text-text-hint-on-light theme-typography--caption from global;
  }
`;

const checkboxMod: Record<CheckboxMod, any> = {
  primary: css`
    checkbox {
      composes: theme-checkbox_primary from global;
    }
  `,
  surface: css`
    checkbox {
      composes: theme-checkbox_surface from global;
    }
  `,
  small: css`
    checkbox {
      composes: theme-checkbox_small from global;
    }
    checkbox-container {
      & checkbox {
        width: 14px;
        height: 14px;
      }
      & checkbox-background {
        width: 14px;
        height: 14px;
      }
    }
  `,
};

const checkboxState = {
  disabled: css`
    checkbox {
      composes: theme-checkbox--disabled from global;
    }
  `,
  checked: css`
    checkbox {
      composes: theme-checkbox--checked from global;
    }
  `,
};

interface ICheckboxMarkupProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style'> {
  label?: string;
  caption?: string;
  indeterminate?: boolean;
  ripple?: boolean;
  mod?: CheckboxMod[];
  style?: ComponentStyle;
}

export { CheckboxMarkupStyles };

export const CheckboxMarkup: React.FC<ICheckboxMarkupProps> = function CheckboxMarkup({
  id,
  label,
  indeterminate,
  className,
  title,
  mod = ['primary'],
  ripple = true,
  style,
  readOnly,
  caption,
  ...rest
}) {
  const styles = useS(CheckboxMarkupStyles);
  const checkboxRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate || false;
    }
  });

  return styled(
    useStyles(
      checkboxStyles,
      ...(mod || []).map(mod => checkboxMod[mod]),
      rest.disabled && checkboxState.disabled,
      rest.checked && checkboxState.checked,
      style,
    ),
  )(
    <checkbox-container className={className} title={title}>
      <checkbox className={s(styles, { checkbox: true })}>
        <checkbox-input ref={checkboxRef} as="input" type="checkbox" {...rest} disabled={rest.disabled || readOnly} id={id || rest.name} />
        <checkbox-background>
          <checkbox-checkmark as="svg" viewBox="0 0 24 24">
            <checkbox-checkmark-path as="path" fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59" />
          </checkbox-checkmark>
          <checkbox-mixedmark />
        </checkbox-background>
        {ripple && <checkbox-ripple />}
      </checkbox>
      {label && (id || rest.name) && (
        <checkbox-label as="label" htmlFor={id || rest.name}>
          {label}
          {caption && <checkbox-caption>{caption}</checkbox-caption>}
        </checkbox-label>
      )}
    </checkbox-container>,
  );
};
