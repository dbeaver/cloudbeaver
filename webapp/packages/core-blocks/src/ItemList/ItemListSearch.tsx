/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Container } from '../Containers/Container';
import { Filter } from '../FormControls/Filter';
import { useTranslate } from '../localization/useTranslate';
import { s } from '../s';
import { useS } from '../useS';
import style from './ItemList.m.css';

interface IProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
}

export const ItemListSearch: React.FC<IProps> = function ItemListSearch({ value, placeholder, disabled, onChange, onSearch, className }) {
  const styles = useS(style);
  const translate = useTranslate();

  return (
    <Container className={s(styles, { listSearch: true }, className)} keepSize>
      <Filter value={value} disabled={disabled} placeholder={translate(placeholder || 'ui_search')} onSearch={onSearch} onChange={onChange} />
    </Container>
  );
};
