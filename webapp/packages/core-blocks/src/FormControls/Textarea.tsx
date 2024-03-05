/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useLayoutEffect, useRef } from 'react';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import { s } from '../s';
import { useS } from '../useS';
import { Field } from './Field';
import { FieldDescription } from './FieldDescription';
import { FieldLabel } from './FieldLabel';
import { FormContext } from './FormContext';
import textareaStyle from './Textarea.m.css';

type BaseProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'style'> &
  ILayoutSizeProps & {
    description?: string;
    labelTooltip?: string;
    embedded?: boolean;
    cursorInitiallyAtEnd?: boolean;
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
  cursorInitiallyAtEnd,
  onChange = () => {},
  ...rest
}: ControlledProps | ObjectProps<any, any>) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const layoutProps = getLayoutProps(rest);
  rest = filterLayoutFakeProps(rest);
  const styles = useS(textareaStyle);
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

  useLayoutEffect(() => {
    if (cursorInitiallyAtEnd && typeof value === 'string') {
      const position = value.length;
      textareaRef.current?.setSelectionRange(position, position);
    }
  }, [cursorInitiallyAtEnd]);

  return (
    <Field {...layoutProps} className={s(styles, { field: true, embedded }, className)}>
      <FieldLabel className={s(styles, { fieldLabel: true })} title={labelTooltip || rest.title} required={required}>
        {children}
      </FieldLabel>
      <textarea
        {...rest}
        ref={textareaRef}
        required={required}
        className={s(styles, { textarea: true })}
        value={value ?? ''}
        name={name}
        data-embedded={embedded}
        onChange={handleChange}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
});
