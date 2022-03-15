/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

import type { ILayoutSizeProps } from '../../Containers/ILayoutSizeProps';
import { TextPlaceholder } from '../../TextPlaceholder';
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
}) {
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (onFocus) {
      onFocus(e.target.name);
    }
  }, [onFocus]);

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
            className={className}
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
