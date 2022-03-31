/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { ReactNode, useImperativeHandle } from 'react';
import { Disclosure, DisclosureContent, DisclosureStateReturn, useDisclosureState } from 'reakit';
import styled, { css, use } from 'reshadow';

import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import { IconOrImage } from '../IconOrImage';

export type ExpandableState = Pick<DisclosureStateReturn, 'setVisible' | 'show' | 'hide' | 'toggle' | 'visible'>;

interface Props {
  label: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  disabled?: boolean;
  style?: ComponentStyle;
}

const styles = css`
  Disclosure {
    border: none;
    padding: 0;
    margin: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    outline: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    max-width: max-content;
  }
  expand-icon {
    display: flex;
    box-sizing: border-box;
    flex-shrink: 0;
    opacity: 0.5;
    width: 16px;
    height: 16px;
    transform: rotate(-90deg);
    margin-right: 8px;

    &[|expanded] {
      transform: rotate(0deg);
    }
  }
  IconOrImage {
    width: 100%;
    height: 100%;
  }
`;

export const Expandable = observer<Props, ExpandableState>(function Expandable({
  label,
  defaultExpanded,
  disabled,
  children,
  style,
}, ref) {
  const disclosure = useDisclosureState({ visible: defaultExpanded ?? false });

  useImperativeHandle(ref, () => disclosure);

  return styled(useStyles(styles, style))(
    <>
      <Disclosure {...disclosure} disabled={disabled}>
        <expand-icon {...use({ expanded: disclosure.visible })}>
          <IconOrImage icon='arrow' />
        </expand-icon>
        <expand-label as='h2'>{label}</expand-label>
      </Disclosure>
      <DisclosureContent {...disclosure}>
        <>{children}</>
      </DisclosureContent>
    </>
  );
}, { forwardRef: true });