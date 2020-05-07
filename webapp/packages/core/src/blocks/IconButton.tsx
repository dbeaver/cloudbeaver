import { Button, ButtonProps } from 'reakit/Button';
import styled, { css } from 'reshadow';

import { Icon } from './Icons/Icon';

const styles = css`
  Button {
    color: rgba(0, 0, 0, 0.45);
    outline: none;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    margin: 4px;
    height: 16px;

    & Icon {
      width: 16px;
      height: 16px;
    }
  }
`;

type Props = {
  name: string;
  viewBox: string;
}

export function IconButton({ name, viewBox, ...rest }: Props & ButtonProps) {
  return styled(styles)(
    <Button {...rest}>
      <Icon name={name} viewBox={viewBox} />
    </Button>
  );
}
