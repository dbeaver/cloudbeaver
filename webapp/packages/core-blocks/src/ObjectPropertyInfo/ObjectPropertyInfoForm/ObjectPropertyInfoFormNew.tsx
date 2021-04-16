/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';

import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

import type { ILayoutSizeProps } from '../../Containers/ILayoutSizeProps';
import { TextPlaceholder } from '../../TextPlaceholder';
import { RenderField } from './RenderField';

interface ObjectPropertyFormProps extends ILayoutSizeProps {
  properties: ObjectPropertyInfo[] | undefined;
  state: Record<string, string | number>;
  category?: string | null;
  editable?: boolean;
  autofillToken?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoHide?: boolean;
  showRememberTip?: boolean;
  onFocus?: (name: string) => void;
}

export const ObjectPropertyInfoFormNew: React.FC<ObjectPropertyFormProps> = observer(function ObjectPropertyInfoFormNew({
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
  layout,
  onFocus,
}) {
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (onFocus) {
      onFocus(e.target.name);
    }
  }, [onFocus]);

  if (!properties || properties.length === 0) {
    return <TextPlaceholder>Properties empty</TextPlaceholder>;
  }

  let filteredProperties: ObjectPropertyInfo[] | null = null;

  if (category !== undefined) {
    if (category === null) {
      filteredProperties = properties.filter(property => !property.category);
    } else {
      filteredProperties = properties.filter(property => property.category === category);
    }
  }

  return (
    <>
      {(filteredProperties || properties).map(property => (
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
          layout={layout}
          onFocus={handleFocus}
        />
      ))}
    </>
  );
});
