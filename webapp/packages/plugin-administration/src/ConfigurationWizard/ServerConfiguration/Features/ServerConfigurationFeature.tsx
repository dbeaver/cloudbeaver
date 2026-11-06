/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { type ReactNode, useId } from 'react';

import {
  CardSection,
  CheckboxMarkup,
  type CheckboxBaseProps,
  type CheckboxType,
  type ICheckboxControlledProps,
  type ICheckboxObjectProps,
  s,
  useCheckboxState,
  useS,
} from '@cloudbeaver/core-blocks';

import styles from './ServerConfigurationFeatures.module.css';

export interface IServerConfigurationFeatureProps {
  description?: ReactNode;
}

export const ServerConfigurationFeature: CheckboxType<IServerConfigurationFeatureProps> = observer(function ServerConfigurationFeature({
  id,
  children,
  description,
  className,
  name,
  value,
  defaultValue,
  state,
  checked,
  defaultChecked,
  inverse,
  autoHide,
  onChange,
  ...props
}: IServerConfigurationFeatureProps & CheckboxBaseProps & (ICheckboxControlledProps | ICheckboxObjectProps<any>)) {
  const classes = useS(styles);
  const generatedId = useId();
  const controlId = id || generatedId;
  const labelId = `${controlId}-label`;
  const descriptionId = `${controlId}-description`;
  const checkboxState = useCheckboxState({ name, value, defaultValue, state, checked, defaultChecked, inverse, onChange });

  if (autoHide && state && name !== undefined && state[name] == null) {
    return null;
  }

  return (
    <CardSection className={s(classes, { feature: true }, className)} data-disabled={props.disabled || props.readOnly || undefined}>
      <CheckboxMarkup
        {...props}
        id={controlId}
        name={name}
        checked={checkboxState.checked}
        className={s(classes, { checkbox: true })}
        aria-labelledby={props['aria-labelledby'] || labelId}
        aria-describedby={[props['aria-describedby'], description && descriptionId].filter(Boolean).join(' ') || undefined}
        onChange={checkboxState.change}
      />
      <label className={s(classes, { label: true })} htmlFor={controlId}>
        <span id={labelId} className={s(classes, { name: true })}>
          {children}
        </span>
        {description && (
          <span id={descriptionId} className={s(classes, { description: true })}>
            {description}
          </span>
        )}
      </label>
    </CardSection>
  );
});
