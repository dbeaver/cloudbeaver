/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObjectRef, useSplitUserState } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import {
  BottomPanelService,
  type IPanelActivation,
  LeftBarPanelService,
  SideBarPanelService,
  type TabsContainer,
  usePanelActivation,
  useTabPersistence,
} from '@cloudbeaver/core-ui';

import { PANEL_ID_BOTTOM_PANEL, PANEL_ID_LEFT_SIDEBAR, PANEL_ID_RIGHT_SIDEBAR } from './AppScreenService.js';

interface IMainPanel {
  readonly container: TabsContainer;
  readonly selection: ReturnType<typeof useTabPersistence>;
  readonly activation: IPanelActivation;
}

interface IMainPanelState {
  readonly layout: {
    readonly mainSplit: ReturnType<typeof useSplitUserState>;
    readonly rightSplit: ReturnType<typeof useSplitUserState>;
    readonly bottomSplit: ReturnType<typeof useSplitUserState>;
    readonly leftDisabled: boolean;
    readonly rightDisabled: boolean;
    readonly bottomDisabled: boolean;
    readonly mainMode: ReturnType<typeof useSplitUserState>['mode'];
    readonly rightMode: ReturnType<typeof useSplitUserState>['mode'];
  };
  readonly left: IMainPanel;
  readonly right: IMainPanel;
  readonly bottom: IMainPanel;
}

export function useMainPanelState(): IMainPanelState {
  const leftBarPanelService = useService(LeftBarPanelService);
  const sideBarPanelService = useService(SideBarPanelService);
  const bottomPanelService = useService(BottomPanelService);

  const leftSelection = useTabPersistence(PANEL_ID_LEFT_SIDEBAR, leftBarPanelService.tabsContainer);
  const rightSelection = useTabPersistence(PANEL_ID_RIGHT_SIDEBAR, sideBarPanelService.tabsContainer);
  const bottomSelection = useTabPersistence(PANEL_ID_BOTTOM_PANEL, bottomPanelService.tabsContainer);

  const mainSplit = useSplitUserState('main');
  const rightSplit = useSplitUserState('main-right');
  const bottomSplit = useSplitUserState('right-area');

  const layout = useObjectRef(
    () => ({
      get leftDisabled() {
        return this.leftContainer.getDisplayed().length === 0;
      },
      get rightDisabled() {
        return this.rightContainer.getDisplayed().length === 0;
      },
      get bottomDisabled() {
        return this.bottomPanelService.isDisabled() || this.bottomContainer.getDisplayed().length === 0;
      },
      get mainMode() {
        return this.leftDisabled ? 'minimize' : this.mainSplit.mode;
      },
      get rightMode() {
        return this.rightDisabled ? 'minimize' : this.rightSplit.mode;
      },
      get bottomMode() {
        return this.bottomDisabled ? 'minimize' : this.bottomSplit.mode;
      },
      get leftVisible() {
        return !this.leftDisabled && this.mainMode !== 'minimize' && (this.mainMode === 'maximize' || this.mainSplit.size !== 0);
      },
      get rightVisible() {
        return (
          !this.rightDisabled &&
          this.mainMode !== 'maximize' &&
          this.rightMode !== 'minimize' &&
          (this.rightMode === 'maximize' || this.rightSplit.size !== 0)
        );
      },
      get bottomVisible() {
        return (
          !this.bottomDisabled &&
          this.mainMode !== 'maximize' &&
          this.rightMode !== 'maximize' &&
          this.bottomMode !== 'minimize' &&
          (this.bottomMode === 'maximize' || this.bottomSplit.size !== 0)
        );
      },
      revealMainContent() {
        if (this.mainMode === 'maximize') {
          if (this.mainSplit.ratio === 1) {
            this.mainSplit.onResize?.(-1, -1);
          }

          this.mainSplit.onModeChange?.('resize');
        }
      },
      revealLeft() {
        if (this.leftDisabled) {
          return;
        }

        if (this.mainSplit.size === 0) {
          this.mainSplit.onResize?.(-1, -1);
        }

        if (this.mainMode === 'minimize') {
          this.mainSplit.onModeChange?.('resize');
        }
      },
      revealRight() {
        if (this.rightDisabled) {
          return;
        }

        this.revealMainContent();

        if (this.rightSplit.size === 0) {
          this.rightSplit.onResize?.(-1, -1);
        }

        if (this.rightMode === 'minimize') {
          this.rightSplit.onModeChange?.('resize');
        }
      },
      revealBottom() {
        if (this.bottomDisabled) {
          return;
        }

        this.revealMainContent();

        if (this.rightMode === 'maximize') {
          if (this.rightSplit.ratio === 1) {
            this.rightSplit.onResize?.(-1, -1);
          }

          this.rightSplit.onModeChange?.('resize');
        }

        if (this.bottomSplit.size === 0) {
          this.bottomSplit.onResize?.(-1, -1);
        }

        if (this.bottomMode === 'minimize') {
          this.bottomSplit.onModeChange?.('resize');
        }
      },
    }),
    {
      leftContainer: leftBarPanelService.tabsContainer,
      rightContainer: sideBarPanelService.tabsContainer,
      bottomContainer: bottomPanelService.tabsContainer,
      bottomPanelService,
      mainSplit,
      rightSplit,
      bottomSplit,
    },
    ['revealLeft', 'revealRight', 'revealBottom'],
  );

  const leftActivation = usePanelActivation(layout.leftContainer, leftSelection, {
    isVisible: () => layout.leftVisible,
    reveal: layout.revealLeft,
  });

  const rightActivation = usePanelActivation(layout.rightContainer, rightSelection, {
    isVisible: () => layout.rightVisible,
    reveal: layout.revealRight,
  });

  const bottomActivation = usePanelActivation(layout.bottomContainer, bottomSelection, {
    isVisible: () => layout.bottomVisible,
    reveal: layout.revealBottom,
  });

  const left = useObjectRef({ container: layout.leftContainer, selection: leftSelection, activation: leftActivation });
  const right = useObjectRef({ container: layout.rightContainer, selection: rightSelection, activation: rightActivation });
  const bottom = useObjectRef({ container: layout.bottomContainer, selection: bottomSelection, activation: bottomActivation });

  return useObjectRef({ layout, left, right, bottom });
}
