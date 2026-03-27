/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { Composite, CompositeItem, Popover } from '@dbeaver/ui-kit';

import { type InputAutocompleteProposal } from './useInputAutocomplete.js';
import { useS } from '../useS.js';
import { BaseDropdownStyles, IconOrImage, s, Text } from '../index.js';
import { forwardRef } from 'react';

interface AutocompletionProps {
  proposals: InputAutocompleteProposal[];
  className?: string;
  onSelect?: (proposal: InputAutocompleteProposal) => void;
}

export const InputAutocompletionMenu = observer(
  forwardRef<HTMLDivElement, AutocompletionProps>(function InputAutocompletionMenu({ proposals, onSelect }, ref) {
    const styles = useS(BaseDropdownStyles);

    return (
      <Popover.PopoverContent ref={ref} className={s(styles, { menu: true })} gutter={4} modal={false} autoFocusOnShow={false} unmountOnHide>
        <Composite>
          {proposals.map(proposal => (
            <CompositeItem key={proposal.title} className={s(styles, { menuItem: true }, 'tw:w-full')} onClick={() => onSelect?.(proposal)}>
              {proposal.icon && (
                <div className={s(styles, { itemIcon: true })}>
                  <IconOrImage icon={proposal.icon} className={s(styles, { iconOrImage: true })} />
                </div>
              )}
              <Text truncate>{proposal.displayString}</Text>
            </CompositeItem>
          ))}
        </Composite>
      </Popover.PopoverContent>
    );
  }),
);
