/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

import type { ILayoutSizeProps } from '../../Containers/ILayoutSizeProps';
import elementsSizeStyles from '../../Containers/shared/ElementsSize.m.css';
import { s } from '../../s';
import { TextPlaceholder } from '../../TextPlaceholder';
import { useS } from '../../useS';
import { RenderField } from './RenderField';

interface ObjectPropertyFormProps extends ILayoutSizeProps {
  properties: ObjectPropertyInfo[];
  state?: Record<string, any>;
  category?: string | null;
  editable?: boolean;
  autofillToken?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoHide?: boolean;
  showRememberTip?: boolean;
  hideEmptyPlaceholder?: boolean;
  onFocus?: (name: string) => void;
}

export const ObjectPropertyInfoForm = observer<ObjectPropertyFormProps>(function ObjectPropertyInfoForm({
  properties,
  state,
  category,
  editable = true,
  className,
  autofillToken = '',
  disabled,
  readOnly,
  autoHide,
  showRememberTip,
  hideEmptyPlaceholder,
  onFocus,
  ...rest
}) {
  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(e.target.name);
      }
    },
    [onFocus],
  );

  const sizeStyles = useS(elementsSizeStyles);

  if (properties.length === 0 && !hideEmptyPlaceholder) {
    return <TextPlaceholder>Properties empty</TextPlaceholder>;
  }

  return (
    <>
      {properties.map(property => {
        if (category !== undefined && property.category !== category) {
          return null;
        }
        return (
          <RenderField
            key={property.id}
            className={s(sizeStyles, { ...rest }, className)}
            property={property}
            state={state}
            editable={editable}
            autofillToken={autofillToken}
            disabled={disabled}
            readOnly={readOnly}
            autoHide={autoHide}
            showRememberTip={showRememberTip}
            onFocus={handleFocus}
          />
        );
      })}
    </>
  );
});
