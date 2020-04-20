import { TLocalizationToken } from './TLocalizationToken';
import { useTranslate } from './useTranslate';

type TranslateProps = {
  token: TLocalizationToken;
}

export function Translate({ token }: TranslateProps) {
  const value = useTranslate(token);

  return <>{value}</>;
}
