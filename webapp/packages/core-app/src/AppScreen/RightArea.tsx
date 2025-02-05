/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
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
    <SlideBox open={optionsPanelService.active} className={s(styles, { slideBox: true }, className)} onClose={close}>
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
        <SlideOverlay onClick={close} />
      </SlideElement>
      <SlideElement>
        <Loader className={s(styles, { loader: true })} suspense>
          <OptionsPanel />
        </Loader>
      </SlideElement>
    </SlideBox>
  );
});
