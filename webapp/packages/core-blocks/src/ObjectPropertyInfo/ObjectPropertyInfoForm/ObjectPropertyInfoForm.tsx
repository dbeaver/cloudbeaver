/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

import { getLayoutProps } from '../../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../../Containers/ILayoutSizeProps';
import elementsSizeStyles from '../../Containers/shared/ElementsSize.m.css';
import { useTranslate } from '../../localization/useTranslate';
import { s } from '../../s';
import { TextPlaceholder } from '../../TextPlaceholder';
import { useS } from '../../useS';
import { RenderField } from './RenderField';

interface ObjectPropertyFormProps extends ILayoutSizeProps {
  properties: ObjectPropertyInfo[];
  state?: Record<string, any>;
  defaultState?: Record<string, any>;
  category?: string | null;
  editable?: boolean;
  autofillToken?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoHide?: boolean;
  showRememberTip?: boolean;
  hideEmptyPlaceholder?: boolean;
  emptyPlaceholder?: string;
  canShowPassword?: boolean;
  isSaved?: (property: ObjectPropertyInfo) => boolean;
  geLayoutSize?: (property: ObjectPropertyInfo) => ILayoutSizeProps;
  onFocus?: (name: string) => void;
}

export const ObjectPropertyInfoForm = observer<ObjectPropertyFormProps>(function ObjectPropertyInfoForm({
  properties,
  state,
  defaultState,
  category,
  editable = true,
  className,
  autofillToken = '',
  disabled,
  readOnly,
  autoHide,
  showRememberTip,
  hideEmptyPlaceholder,
  emptyPlaceholder = 'core_blocks_object_property_info_form_empty_placeholder',
  canShowPassword,
  isSaved,
  geLayoutSize,
  onFocus,
  ...rest
}) {
  const translate = useTranslate();
  const layoutProps = getLayoutProps(rest);
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
    return <TextPlaceholder>{translate(emptyPlaceholder)}</TextPlaceholder>;
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
            className={s(sizeStyles, { ...(geLayoutSize ? geLayoutSize(property) : layoutProps) }, className)}
            property={property}
            state={state}
            defaultState={defaultState}
            editable={editable}
            autofillToken={autofillToken}
            disabled={disabled}
            readOnly={readOnly}
            autoHide={autoHide}
            showRememberTip={showRememberTip}
            canShowPassword={canShowPassword}
            saved={isSaved?.(property)}
            onFocus={handleFocus}
          />
        );
      })}
    </>
  );
});
