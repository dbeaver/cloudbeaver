/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Icon,
  Loader,
  Pane,
  Placeholder,
  ResizerControls,
  s,
  SlideBox,
  SlideElement,
  SlideOverlay,
  Split,
  useS,
  useSplitUserState,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { OptionsPanelService } from '@cloudbeaver/core-ui';

import { AppScreenService } from './AppScreenService.js';
import style from './RightArea.module.css';
import { Dialog, IconButton } from '@dbeaver/ui-kit';

interface Props {
  className?: string;
}

export const RightArea = observer<Props>(function RightArea({ className }) {
  const styles = useS(style);
  const appScreenService = useService(AppScreenService);
  const optionsPanelService = useService(OptionsPanelService);
  const splitState = useSplitUserState('right-area');

  const OptionsPanel = optionsPanelService.getPanelComponent();

  const toolsDisabled = appScreenService.rightAreaBottom.getDisplayed({}).length === 0;

  function close() {
    optionsPanelService.close();
  }

  return (
    <SlideBox open={optionsPanelService.active} className={s(styles, { slideBox: true }, className)}>
      <SlideElement>
        <Split {...splitState} sticky={30} split="horizontal" mode={toolsDisabled ? 'minimize' : splitState.mode} disable={toolsDisabled} keepRatio>
          <Pane className={s(styles, { pane: true })}>
            <Loader className={s(styles, { loader: true })} suspense>
              <Placeholder container={appScreenService.rightAreaTop} />
            </Loader>
          </Pane>
          <ResizerControls />
          <Pane className={s(styles, { pane: true })} basis="30%" main>
            <Loader className={s(styles, { loader: true })} suspense>
              <Placeholder container={appScreenService.rightAreaBottom} />
            </Loader>
          </Pane>
        </Split>
      </SlideElement>
      <SlideOverlay onClick={close} />

      <SlideElement>
        <Dialog
          portal={false}
          unmountOnHide={false}
          animated={false}
          data-size="free"
          open={optionsPanelService.active}
          className="tw:w-full tw:h-full tw:overflow-visible! tw:bg-transparent!"
          onClose={close}
        >
          <Loader className={s(styles, { loader: true })} suspense>
            <OptionsPanel />
          </Loader>
          <IconButton size="small" aria-label="Close panel" className={s(styles, { iconBtn: true })} onClick={close}>
            <Icon name="cross" viewBox="0 0 24 24" />
          </IconButton>
        </Dialog>
      </SlideElement>
    </SlideBox>
  );
});
