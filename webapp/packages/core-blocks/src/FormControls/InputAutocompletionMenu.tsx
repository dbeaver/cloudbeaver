/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type { RefObject } from 'react';

import BaseDropdownStyles from '../FormControls/BaseDropdown.module.css';
import { IconOrImage } from '../IconOrImage.js';
import { Menu } from '../Menu/Menu.js';
import { MenuItem } from '../Menu/MenuItem.js';
import type { IMenuState } from '../Menu/MenuStateContext.js';
import { s } from '../s.js';
import { Text } from '../Text.js';
import { useS } from '../useS.js';
import style from './InputAutocompletionMenu.module.css';
import { type InputAutocompleteProposal } from './useInputAutocomplete.js';

interface AutocompletionProps {
  position: { x: number; y: number };
  proposals: InputAutocompleteProposal[];
  menuRef: RefObject<IMenuState>;
  className?: string;
  onSelect?: (proposal: InputAutocompleteProposal) => void;
}

export const InputAutocompletionMenu = observer(function InputAutocompletionMenu({
  position,
  className,
  menuRef,
  proposals,
  onSelect,
}: AutocompletionProps) {
  const styles = useS(style, BaseDropdownStyles);
  const contextMenuPosition = {
    position,
    handleContextMenuOpen: () => {},
  };

  function handleSelect(proposal: InputAutocompleteProposal) {
    menuRef.current?.hide();
    onSelect?.(proposal);
  }

  if (!proposals.length) {
    return;
  }

  return (
    <Menu
      contextMenuPosition={contextMenuPosition}
      visible={proposals.length > 0}
      panelAvailable={proposals.length > 0}
      className={s(styles, { menu: true }, className)}
      menuRef={menuRef}
      label="Autocompletion"
      items={proposals.map(proposal => (
        <MenuItem
          key={proposal.displayString}
          id={proposal.displayString}
          type="button"
          title={proposal.title}
          className={s(styles, { menuItem: true })}
          onClick={event => handleSelect(proposal)}
        >
          {proposal.icon && (
            <div className={s(styles, { itemIcon: true })}>
              <IconOrImage icon={proposal.icon} className={s(styles, { iconOrImage: true })} />
            </div>
          )}
          <Text truncate>{proposal.displayString}</Text>
        </MenuItem>
      ))}
      modal
    />
  );
});
