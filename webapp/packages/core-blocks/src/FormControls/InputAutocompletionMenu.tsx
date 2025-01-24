/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';

import BaseDropdownStyles from '../FormControls/BaseDropdown.module.css';
import { getComputed } from '../getComputed.js';
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
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  className?: string;
  onSelect?: (proposal: InputAutocompleteProposal) => void;
}

export const InputAutocompletionMenu = observer(function InputAutocompletionMenu({
  position,
  className,
  proposals,
  inputRef,
  onSelect,
}: AutocompletionProps) {
  const styles = useS(style, BaseDropdownStyles);
  const menuRef = useRef<IMenuState>();
  const contextMenuPosition = getComputed(() => ({
    position,
    handleContextMenuOpen: () => {},
  }));

  function handleSelect(proposal: InputAutocompleteProposal) {
    menuRef.current?.hide();
    onSelect?.(proposal);
  }

  function handleKeyDown(event: any) {
    switch (event.key) {
      case 'Escape':
        menuRef.current?.hide();
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        menuRef.current?.first();
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    const input = inputRef.current!;

    input.addEventListener('keydown', handleKeyDown);

    return () => {
      input.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
