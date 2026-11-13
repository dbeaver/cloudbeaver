/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Loader, Pane, Placeholder, ResizerControls, s, SlideDialog, Split, useS, type useSplitUserState } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { OptionsPanelService } from '@cloudbeaver/core-ui';

import { AppScreenService, PANEL_ID_MAIN_CONTENT } from './AppScreenService.js';
import style from './RightArea.module.css';

interface Props {
  className?: string;
  splitState: ReturnType<typeof useSplitUserState>;
  bottomPanelDisabled: boolean;
  bottomPanelSlot: React.ReactNode;
}

export const RightArea = observer<Props>(function RightArea({ className, splitState, bottomPanelDisabled, bottomPanelSlot }) {
  const styles = useS(style);
  const appScreenService = useService(AppScreenService);
  const optionsPanelService = useService(OptionsPanelService);

  const OptionsPanel = optionsPanelService.getPanelComponent();

  function close() {
    optionsPanelService.close();
  }

  return (
    <div data-panel-id={PANEL_ID_MAIN_CONTENT} tabIndex={-1} className={s(styles, { container: true }, className)}>
      <Split
        {...splitState}
        sticky={30}
        split="horizontal"
        mode={bottomPanelDisabled ? 'minimize' : splitState.mode}
        disable={bottomPanelDisabled}
        keepRatio
      >
        <Pane className={s(styles, { pane: true })}>
          <Loader className={s(styles, { loader: true })} suspense>
            <Placeholder container={appScreenService.rightAreaTop} />
          </Loader>
        </Pane>
        <ResizerControls />
        <Pane className={s(styles, { pane: true })} basis="30%" main>
          <Loader className={s(styles, { loader: true })} suspense>
            {bottomPanelSlot}
          </Loader>
        </Pane>
      </Split>
      <SlideDialog open={optionsPanelService.active} onClose={close}>
        <OptionsPanel />
      </SlideDialog>
    </div>
  );
});
