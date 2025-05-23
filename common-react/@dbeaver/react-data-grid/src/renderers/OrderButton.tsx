import { clsx, IconButton } from '@dbeaver/ui-kit';

interface OrderButtonProps {
  colIdx: number;
  sortState?: 'asc' | 'desc' | null;
  onSort: (attributePosition: number, order: 'asc' | 'desc' | null, isMultiple: boolean) => void;
  tabIndex?: number;
  ref: React.Ref<HTMLButtonElement>;
}

export function OrderButton({ colIdx, sortState, onSort, tabIndex, ref }: OrderButtonProps) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const nextSortState = sortState === 'asc' ? 'desc' : sortState === 'desc' ? null : 'asc';
    onSort(colIdx, nextSortState, e.ctrlKey || e.metaKey);
  }

  const svgSortAsc = '#icon-sort-asc';
  const svgSortDesc = '#icon-sort-desc';
  const svgSortUnknown = '#icon-sort-unknown';

  const iconSrc = sortState === 'asc' ? svgSortAsc : sortState === 'desc' ? svgSortDesc : svgSortUnknown;

  return (
    <IconButton
      variant="secondary"
      size="small"
      onClick={handleClick}
      tabIndex={tabIndex}
      ref={ref}
      title="Sort by column"
      aria-label="Sort by column"
      className={clsx(
        'tw:opacity-0 tw:group-focus:opacity-100 tw:focus:opacity-100 tw:group-hover:opacity-100 tw:hover:opacity-100 tw:outline-offset-0',
        sortState && 'tw:opacity-100',
      )}
    >
      <svg width="16" height="16" viewBox="0 0 16 16">
        <use href={iconSrc} />
      </svg>
    </IconButton>
  );
}
