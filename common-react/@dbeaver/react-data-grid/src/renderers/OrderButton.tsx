import { clsx, IconButton, Icon } from '@dbeaver/ui-kit';
import { useImperativeHandle, type Ref } from 'react';

interface OrderButtonProps {
  colIdx: number;
  sortState?: 'asc' | 'desc' | null;
  onSort: (attributePosition: number, order: 'asc' | 'desc' | null, isMultiple: boolean) => void;
  tabIndex?: number;
  ref: Ref<{ sort: (e: React.KeyboardEvent<HTMLButtonElement>) => void }> | null;
}

export function OrderButton({ colIdx, sortState, onSort, tabIndex, ref }: OrderButtonProps) {
  function handleSort(e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) {
    const nextSortState = sortState === 'asc' ? 'desc' : sortState === 'desc' ? null : 'asc';
    onSort(colIdx, nextSortState, e.ctrlKey || e.metaKey);
  }

  const svgSortAsc = 'sort-asc';
  const svgSortDesc = 'sort-desc';
  const svgSortUnknown = 'sort-unknown';

  const iconSrc = sortState === 'asc' ? svgSortAsc : sortState === 'desc' ? svgSortDesc : svgSortUnknown;

  useImperativeHandle(ref, () => ({
    sort: handleSort,
  }));

  return (
    <IconButton
      variant="secondary"
      size="small"
      onClick={handleSort}
      tabIndex={tabIndex}
      title="Sort by column"
      aria-label="Sort by column"
      className={clsx(
        'tw:opacity-0 tw:group-focus:opacity-100 tw:focus:opacity-100 tw:group-hover:opacity-100 tw:hover:opacity-100 tw:outline-offset-0',
        sortState && 'tw:opacity-100',
      )}
    >
      <Icon name={iconSrc} />
    </IconButton>
  );
}
