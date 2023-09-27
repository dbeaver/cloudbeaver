/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import elementsSizeStyles from '../Containers/shared/ElementsSize.m.css';
import { s } from '../s';
import { useS } from '../useS';
import { FormContext } from './FormContext';
import formControlStyles from './FormControl.m.css';
import textareaStyle from './Textarea.m.css';

type BaseProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'style'> &
  ILayoutSizeProps & {
    description?: string;
    labelTooltip?: string;
    embedded?: boolean;
  };

type ControlledProps = BaseProps & {
  name?: string;
  value?: string;
  onChange?: (value: string, name?: string) => any;
  state?: never;
};

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  onChange?: (value: string, name: TKey) => any;
  value?: never;
};

interface TextareaType {
  (props: ControlledProps): JSX.Element;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): JSX.Element;
}

export const Textarea: TextareaType = observer(function Textarea({
  name,
  value: controlledValue,
  state,
  required,
  children,
  className,
  description,
  labelTooltip,
  embedded,
  onChange = () => {},
  ...rest
}: ControlledProps | ObjectProps<any, any>) {
  const layoutProps = getLayoutProps(rest);
  rest = filterLayoutFakeProps(rest);
  const styles = useS(formControlStyles, elementsSizeStyles, textareaStyle);
  const context = useContext(FormContext);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (state) {
        state[name] = event.target.value;
      }
      if (onChange) {
        onChange(event.target.value, name);
      }
      if (context) {
        context.change(event.target.value, name);
      }
    },
    [state, name, onChange],
  );

  const value = state ? state[name] : controlledValue;

  return (
    <div className={s(styles, { ...layoutProps, field: true, embedded }, className)}>
      <label className={s(styles, { fieldLabel: true })} title={labelTooltip || rest.title}>
        {children}
        {required && ' *'}
      </label>
      <textarea
        {...rest}
        className={s(styles, { textarea: true })}
        value={value ?? ''}
        name={name}
        data-embedded={embedded}
        onChange={handleChange}
      />
      {description && <div className={s(styles, { fieldDescription: true })}>{description}</div>}
    </div>
  );
});
