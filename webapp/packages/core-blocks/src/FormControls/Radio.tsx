/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps.js';
import { Field } from './Field.js';
import { Radio as UiKitRadio } from '@dbeaver/ui-kit';
import type { ControlSize } from '@dbeaver/ui-kit/types/controls';
import './Radio.css';

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> &
  ILayoutSizeProps & {
    size?: ControlSize;
    value?: string | number;
  };

type ControlledProps = BaseProps & {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => any;
};

type RadioType = (props: ControlledProps) => React.JSX.Element;

export const Radio: RadioType = observer(function Radio({ value, className, children, ...rest }: ControlledProps) {
  const layoutProps = getLayoutProps(rest);
  rest = filterLayoutFakeProps(rest);

  return (
    <Field {...layoutProps} className={className}>
      <UiKitRadio value={value ?? ''} {...rest}>
        {children}
      </UiKitRadio>
    </Field>
  );
});
