import { clsx, IconButton, Icon } from '@dbeaver/ui-kit';

interface OrderButtonProps {
  sortState?: 'asc' | 'desc' | null;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
  tabIndex?: number;
}

export function OrderButton({ sortState, onClick, tabIndex }: OrderButtonProps) {
  const svgSortAsc = 'sort-asc';
  const svgSortDesc = 'sort-desc';
  const svgSortUnknown = 'sort-unknown';

  const iconSrc = sortState === 'asc' ? svgSortAsc : sortState === 'desc' ? svgSortDesc : svgSortUnknown;

  return (
    <IconButton
      variant="secondary"
      size="small"
      onClick={onClick}
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
