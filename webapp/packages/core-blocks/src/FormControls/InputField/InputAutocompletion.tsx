/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useEffect, useRef } from 'react';
import { Menu, MenuButton, type MenuInitialState, MenuItem, useMenuState } from 'reakit';

import { Icon } from '../../Icon.js';
import { useCombinedRef } from '../../useCombinedRef.js';
import { useS } from '../../useS.js';
import style from './InputAutocompletion.module.css';
import { type InputAutocompleteProposal, type InputAutocompleteStrategy, useInputAutocomplete } from './useInputAutocomplete.js';

interface AutocompletionProps {
  sourceHints: InputAutocompleteProposal[];
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  matchStrategy?: InputAutocompleteStrategy;
  placement?: MenuInitialState['placement'];
  gutter?: number;
  ref?: React.Ref<HTMLDivElement>;
  propertyName?: string;
  onSelect?: (proposal: InputAutocompleteProposal) => void;
}

export const InputAutocompletion = observer(
  forwardRef(function Autocompletion(
    { sourceHints, placement = 'bottom-end', gutter = 1, matchStrategy, propertyName, inputRef, onSelect }: AutocompletionProps,
    ref: React.Ref<HTMLDivElement>,
  ) {
    const styles = useS(style);
    const menuRef = useRef<HTMLDivElement>(null);
    const menu = useMenuState({
      placement: placement,
      gutter: gutter,
    });
    const autocompleteState = useInputAutocomplete(inputRef, {
      sourceHints,
      matchStrategy,
    });

    function handleSelect(proposal: InputAutocompleteProposal) {
      menu.hide();
      autocompleteState.replaceCurrentWord(proposal.replacementString);
      onSelect?.(proposal);
    }

    function handleKeyDown(event: any) {
      if (!autocompleteState.filteredSuggestions.length) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          menu.next();
          break;
        case 'ArrowUp':
          event.preventDefault();
          menu.previous();
          break;
        case 'Escape':
          menu.hide();
          break;
        default:
          break;
      }
    }

    const combinedRef = useCombinedRef(menuRef, ref);

    useEffect(() => {
      inputRef.current?.addEventListener('keydown', handleKeyDown);
      return () => {
        inputRef.current?.removeEventListener('keydown', handleKeyDown);
      };
    }, []);

    useEffect(() => {
      if (menu.visible && (autocompleteState.filteredSuggestions === null || autocompleteState.filteredSuggestions.length === 0)) {
        menu.hide();
      }
      if (!menu.visible && autocompleteState.filteredSuggestions !== null && autocompleteState.filteredSuggestions.length !== 0) {
        menu.show();
      }
    }, [sourceHints, menu, autocompleteState.filteredSuggestions]);

    return (
      <>
        <MenuButton {...menu} className={styles['menuButton']}>
          <Icon name="arrow" viewBox="0 0 16 16" />
        </MenuButton>
        <Menu {...menu} ref={combinedRef} aria-label={propertyName} className={styles['menu']} modal>
          {autocompleteState.filteredSuggestions.map(item => (
            <MenuItem
              key={item.displayString}
              id={item.displayString}
              type="button"
              title={item.title}
              {...menu}
              className={styles['menuItem']}
              onClick={event => handleSelect(item)}
            >
              {/* {item.icon && (
                <div data-testid="item-icon" className={styles.itemIcon}>
                  {item.icon && typeof item.icon === 'string' ? <IconOrImage icon={item.icon} className={styles.iconOrImage} /> : item.icon}
                </div>
              )} */}
              <div data-testid="item-value">{item.displayString}</div>
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }),
);
