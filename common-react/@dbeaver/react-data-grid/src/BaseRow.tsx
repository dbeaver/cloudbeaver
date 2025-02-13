import { Row, type RenderRowProps } from 'react-data-grid';

export const BaseRow = function BaseRow<TRow, TSummaryRow>(props: RenderRowProps<TRow, TSummaryRow>) {
  return <Row {...props} />;
};
