/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, type ReactNode, useImperativeHandle } from 'react';
import { Disclosure, DisclosureContent, type DisclosureStateReturn, useDisclosureState } from 'reakit';

import { IconOrImage } from '../IconOrImage.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './Expandable.module.css';

export type ExpandableState = Pick<DisclosureStateReturn, 'setVisible' | 'show' | 'hide' | 'toggle' | 'visible'>;

interface Props {
  label: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  disabled?: boolean;
}

export const Expandable = observer<Props, ExpandableState>(
  forwardRef(function Expandable({ label, defaultExpanded, disabled, children }, ref) {
    const styles = useS(style);
    const disclosure = useDisclosureState({ visible: defaultExpanded ?? false });

    useImperativeHandle(ref, () => disclosure);

    return (
      <>
        <Disclosure className={s(styles, { disclosure: true })} {...disclosure} disabled={disabled}>
          <div className={s(styles, { expandIcon: true, expanded: disclosure.visible })}>
            <IconOrImage className={s(styles, { iconOrImage: true })} icon="arrow" />
          </div>
          <h2 className={s(styles, { expandLabel: true })}>{label}</h2>
        </Disclosure>
        <DisclosureContent {...disclosure}>
          <>{children}</>
        </DisclosureContent>
      </>
    );
  }),
);
