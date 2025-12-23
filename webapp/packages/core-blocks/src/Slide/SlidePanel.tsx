/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IconButton } from '@dbeaver/ui-kit';
import { SlideElement, Icon, Loader, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

interface SlidePanelProps {
  children?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

import style from './SlidePanel.module.css';

export const SLIDE_PANEL_CLOSE_BUTTON_ID = 'slide-panel-close-button';

export function SlidePanel({ children, isOpen, onClose }: SlidePanelProps): React.ReactElement {
  const styles = useS(style);
  const t = useTranslate();

  return (
    <SlideElement open={isOpen}>
      {isOpen && (
        <IconButton
          id={SLIDE_PANEL_CLOSE_BUTTON_ID}
          size="small"
          aria-label={t('core_blocks_dialog_element_close_tooltip')}
          className={s(styles, { iconBtn: true })}
          autoFocus
          onClick={onClose}
        >
          <Icon name="cross" viewBox="0 0 24 24" />
        </IconButton>
      )}
      <Loader className={s(styles, { loader: true })} suspense>
        {children}
      </Loader>
    </SlideElement>
  );
}
