/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useEffect, useRef } from 'react';
import { MenuItem } from 'reakit';

import { Container } from '../../Containers/Container.js';
import { getComputed } from '../../getComputed.js';
import { IconOrImage } from '../../IconOrImage.js';
import { Menu } from '../../Menu/Menu.js';
import type { IMenuState } from '../../Menu/MenuStateContext.js';
import { s } from '../../s.js';
import { Text } from '../../Text.js';
import { useS } from '../../useS.js';
import style from './InputAutocompletionMenu.module.css';
import { type InputAutocompleteProposal, type InputAutocompleteStrategy, useInputAutocomplete } from './useInputAutocomplete.js';

interface AutocompletionProps {
  sourceHints: InputAutocompleteProposal[];
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  matchStrategy?: InputAutocompleteStrategy;
  className?: string;
  onSelect?: (proposal: InputAutocompleteProposal) => void;
}

export const InputAutocompletionMenu = observer(
  forwardRef(function InputAutocompletionMenu({ sourceHints, className, matchStrategy, inputRef, onSelect }: AutocompletionProps) {
    const styles = useS(style);
    const menuRef = useRef<IMenuState>();
    const autocompleteState = useInputAutocomplete(inputRef, {
      sourceHints,
      matchStrategy,
    });

    function handleSelect(proposal: InputAutocompleteProposal) {
      hideMenu();
      autocompleteState.replaceCurrentWord(proposal.replacementString);
      onSelect?.(proposal);
    }

    function hideMenu() {
      menuRef.current?.hide();
      autocompleteState.prevented = true;
    }

    function handleKeyDown(event: any) {
      if (!autocompleteState.filteredSuggestions.length) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          menuRef.current?.next();
          break;
        case 'ArrowUp':
          event.preventDefault();
          menuRef.current?.previous();
          break;
        case 'Escape':
          hideMenu();
          break;
        default:
          break;
      }
    }

    useEffect(() => {
      inputRef.current?.addEventListener('keydown', handleKeyDown);
      return () => {
        inputRef.current?.removeEventListener('keydown', handleKeyDown);
      };
    }, [inputRef.current, menuRef.current]);

    useEffect(() => {
      if (menuRef.current?.visible && (autocompleteState.filteredSuggestions === null || autocompleteState.filteredSuggestions.length === 0)) {
        menuRef.current?.hide();
      }
      if (!menuRef.current?.visible && autocompleteState.filteredSuggestions !== null && autocompleteState.filteredSuggestions.length !== 0) {
        menuRef.current?.show();
      }
    }, [sourceHints, menuRef, autocompleteState.filteredSuggestions]);

    return (
      <Menu
        className={s(styles, { menu: true }, className)}
        menuRef={menuRef}
        label="Autocompletion"
        items={autocompleteState.filteredSuggestions.map(item => (
          <MenuItem
            key={item.displayString}
            id={item.displayString}
            type="button"
            title={item.title}
            className={styles['menuItem']}
            onClick={event => handleSelect(item)}
          >
            {item.icon && (
              <Container className={styles['itemIcon']}>
                <IconOrImage icon={item.icon} className={styles['iconOrImage']} />
              </Container>
            )}
            <Text truncate>{item.displayString}</Text>
          </MenuItem>
        ))}
        modal
      />
    );
  }),
);
