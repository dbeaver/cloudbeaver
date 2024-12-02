/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Container } from '../Containers/Container.js';
import { Filter } from '../FormControls/Filter.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './ItemList.module.css';

interface IProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  permanentSearchIcon?: boolean;
}

export const ItemListSearch: React.FC<IProps> = function ItemListSearch({
  value,
  placeholder,
  permanentSearchIcon,
  disabled,
  onChange,
  onSearch,
  className,
}) {
  const styles = useS(style);
  const translate = useTranslate();

  return (
    <Container className={s(styles, { listSearch: true }, className)} keepSize>
      <Filter
        value={value}
        disabled={disabled}
        placeholder={translate(placeholder || 'ui_search')}
        permanentSearchIcon={permanentSearchIcon}
        onSearch={onSearch}
        onChange={onChange}
      />
    </Container>
  );
};
