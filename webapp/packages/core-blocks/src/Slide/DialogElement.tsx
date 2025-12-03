/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Dialog, IconButton } from '@dbeaver/ui-kit';
import { SlideElement, Icon, Loader, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

interface RightPanelProps {
  children?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

import style from './DialogElement.module.css';

//TODO: introduced to support legacy layout, to be removed later in https://github.com/dbeaver/pro/issues/7696
export function DialogElement({ children, isOpen, onClose }: RightPanelProps): React.ReactElement {
  const styles = useS(style);
  const t = useTranslate();
  return (
    <SlideElement>
      <Dialog
        modal={false}
        backdrop={false}
        autoFocusOnShow={false}
        animated={false}
        data-size="free"
        open={isOpen}
        className="tw:w-full tw:h-full tw:overflow-visible! tw:bg-transparent!"
        onClose={onClose}
      >
        <Loader className={s(styles, { loader: true })} suspense>
          {children}
        </Loader>
        <IconButton
          size="small"
          aria-label={t('core_blocks_dialog_element_close_tooltip')}
          className={s(styles, { iconBtn: true })}
          onClick={onClose}
        >
          <Icon name="cross" viewBox="0 0 24 24" />
        </IconButton>
      </Dialog>
    </SlideElement>
  );
}
