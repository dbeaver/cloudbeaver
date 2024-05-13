/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container } from '../Containers/Container';
import { ITag, Tag } from '../Tags/Tag';
import { Tags } from '../Tags/Tags';
import { Combobox, ComboboxBaseProps } from './Combobox';

interface IItemValue {
  id: string;
  label: string;
  icon?: string;
}

// @TODO use [name] and [state] pattern for the component
export interface ITagsComboboxProps extends ComboboxBaseProps<string, IItemValue> {
  addedItems: string[];
  onAdd: (key: string) => void;
  onRemove: (key: string, index: number) => void;
}

export const TagsCombobox: React.FC<ITagsComboboxProps> = observer(function TagsCombobox({ addedItems, onAdd, onRemove, ...rest }) {
  const tags: ITag[] = [];

  for (const addedItem of addedItems) {
    const item = rest.items.find(item => item.id === addedItem);

    if (item) {
      tags.push({
        id: item.id,
        label: item.label,
        icon: item.icon,
      });
    }
  }

  function add(key: string) {
    if (!addedItems.includes(key)) {
      onAdd(key);
    }
  }

  function remove(key: string) {
    const index = addedItems.indexOf(key);

    if (index !== -1) {
      onRemove(key, index);
    }
  }

  return (
    <Container vertical gap dense>
      <Combobox
        keySelector={item => item.id}
        valueSelector={value => value.label}
        iconSelector={value => value.icon}
        isDisabled={item => addedItems.includes(item.id)}
        searchable
        onSelect={add}
        {...rest}
      />
      <Tags>
        {tags.map(tag => (
          <Tag key={tag.id} id={tag.id} label={tag.label} icon={tag.icon} onRemove={remove} />
        ))}
      </Tags>
    </Container>
  );
});
