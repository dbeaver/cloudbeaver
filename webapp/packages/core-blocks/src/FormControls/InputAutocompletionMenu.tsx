/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useLayoutEffect, useRef } from 'react';

import BaseDropdownStyles from '../FormControls/BaseDropdown.module.css';
import { IconOrImage } from '../IconOrImage.js';
import { Menu } from '../Menu/Menu.js';
import { MenuItem } from '../Menu/MenuItem.js';
import type { IMenuState } from '../Menu/MenuStateContext.js';
import { s } from '../s.js';
import { Text } from '../Text.js';
import { useObservableRef } from '../useObservableRef.js';
import { useS } from '../useS.js';
import style from './InputAutocompletionMenu.module.css';
import { type InputAutocompleteProposal } from './useInputAutocomplete.js';

interface AutocompletionProps {
  proposals: InputAutocompleteProposal[];
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  className?: string;
  onSelect?: (proposal: InputAutocompleteProposal) => void;
}

const CONTEXT_INPUT_OFFSET_Y = 3;

export const InputAutocompletionMenu = observer(function InputAutocompletionMenu({ className, proposals, inputRef, onSelect }: AutocompletionProps) {
  const styles = useS(style, BaseDropdownStyles);
  const menuRef = useRef<IMenuState>();
  const state = useObservableRef(
    () => ({
      x: 0,
      y: 0,
      inputValue: '',
    }),
    {
      x: observable.ref,
      y: observable.ref,
      inputValue: observable.ref,
    },
    false,
  );

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

  function handleInput(event: any) {
    state.inputValue = event.target.value;
  }

  useLayoutEffect(() => {
    if (!inputRef.current) {
      return;
    }

    const span = document.createElement('span');
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    span.style.whiteSpace = 'pre';
    span.style.fontFamily = window.getComputedStyle(inputRef.current).fontFamily;
    span.style.fontSize = window.getComputedStyle(inputRef.current).fontSize;
    span.textContent = state.inputValue;

    document.body.appendChild(span);
    const spanRect = span.getBoundingClientRect();
    const letterWidth = spanRect.width / state.inputValue.length;
    document.body.removeChild(span);

    state.x = spanRect.width + letterWidth;
    state.y = spanRect.height + CONTEXT_INPUT_OFFSET_Y;

    menuRef.current?.show();
  }, [state.inputValue, inputRef.current]);

  useEffect(() => {
    inputRef.current?.addEventListener('keydown', handleKeyDown);
    inputRef.current?.addEventListener('input', handleInput);

    return () => {
      inputRef.current?.removeEventListener('keydown', handleKeyDown);
      inputRef.current?.removeEventListener('input', handleInput);
    };
  }, [inputRef.current]);

  if (!proposals.length) {
    return;
  }

  return (
    <Menu
      menuButtonPosition={{
        x: state.x,
        y: state.y,
      }}
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
