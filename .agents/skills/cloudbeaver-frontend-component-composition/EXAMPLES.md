# Component composition examples

The connection summary is illustrative. The examples use Tailwind utilities with the `tw:` prefix
and `clsx` to combine class names.

## Before: a layout builds its caller's action

```tsx
interface Props {
  title: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionLoading?: boolean;
}
```

The title, description, and icon fill regions. The last four props exist only to construct a
button. This summary owns no connection behavior: its feature caller already decides whether
connecting is allowed, starts the operation, and handles failures. Keep that logic with the caller
or its existing action component, rather than moving it into this layout.

## Slots: the arrangement is fixed

The layout accepts finished UI for each region:

```tsx
import type { PropsWithChildren, ReactNode } from 'react';

interface Props {
  mediaSlot?: ReactNode;
  descriptionSlot?: ReactNode;
  actionsSlot?: ReactNode;
}

export function ConnectionSummary({ children, mediaSlot, descriptionSlot, actionsSlot }: PropsWithChildren<Props>) {
  return (
    <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-3">
      {mediaSlot}
      <div className="tw:min-w-0 tw:flex-1 tw:[overflow-wrap:anywhere]">
        <div>{children}</div>
        {descriptionSlot}
      </div>
      {actionsSlot}
    </div>
  );
}
```

The caller supplies the icon, description, and complete button:

```tsx
<ConnectionSummary
  mediaSlot={<DatabaseIcon />}
  descriptionSlot={<span>{connectionDescription}</span>}
  actionsSlot={
    <Button disabled={!canConnect} loading={connecting} onClick={handleConnect}>
      {connectLabel}
    </Button>
  }
>
  {connectionName}
</ConnectionSummary>
```

The layout never reads permissions or builds a button. The caller controls disabled/loading state,
labels, tooltips, click behavior, and the button's own styling. Absent slots emit no empty
wrapper, and flex layout does not reserve an unused media or action column. This example keeps a
content container because it is the fixed main region.

## Compound parts: callers need different arrangements

Two buttons alone still fit `actionsSlot`. Use parts when callers also need to move regions, for
example placing actions beside the content in one view and beneath it in another.

The root owns the layout and its size variant:

```tsx
import type { ComponentPropsWithoutRef } from 'react';

import clsx from 'clsx';

interface Props extends ComponentPropsWithoutRef<'div'> {
  size?: 'small' | 'medium';
}

export function ConnectionSummary({ size = 'medium', className, ...rest }: Props) {
  return (
    <div
      data-size={size}
      className={clsx('tw:flex tw:min-w-0 tw:items-center tw:gap-3 tw:data-[size=small]:gap-2', className)}
      {...rest}
    />
  );
}
```

The content part owns the flexible content region:

```tsx
import type { ComponentPropsWithoutRef } from 'react';

import clsx from 'clsx';

export function ConnectionSummaryContent({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={clsx('tw:min-w-0 tw:flex-1 tw:[overflow-wrap:anywhere]', className)} {...rest} />;
}
```

The actions part groups caller-owned controls:

```tsx
import type { ComponentPropsWithoutRef } from 'react';

import clsx from 'clsx';

export function ConnectionSummaryActions({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={clsx('tw:ms-auto tw:flex tw:flex-wrap tw:items-center tw:gap-2', className)} {...rest} />;
}
```

Caller:

```tsx
<ConnectionSummary size="small">
  <DatabaseIcon />
  <ConnectionSummaryContent>
    <div>{connectionName}</div>
    <div>{connectionDescription}</div>
    {additionalContent}
  </ConnectionSummaryContent>
  <ConnectionSummaryActions>
    <Button disabled={!canConnect} loading={connecting} onClick={handleConnect}>
      {connectLabel}
    </Button>
    {secondaryAction}
  </ConnectionSummaryActions>
</ConnectionSummary>
```

Another caller can place the same actions beneath its content without a layout flag:

```tsx
<ConnectionSummary>
  <ConnectionSummaryContent>
    <div>{connectionName}</div>
    <div>{connectionDescription}</div>
    <ConnectionSummaryActions>{connectionActions}</ConnectionSummaryActions>
  </ConnectionSummaryContent>
</ConnectionSummary>
```

The caller can omit media, content, or actions without flags. Root `size` controls spacing through
`tw:data-[size=small]:gap-2`, with no context. There are only two dedicated parts because they have
reusable layout jobs. Introduce `ConnectionSummaryTitle` or `ConnectionSummaryDescription` when shared typography or
semantics justify those parts, rather than wrapping every element mechanically.
