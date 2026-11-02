import * as matchUrlWildcard from 'match-url-wildcard';

export function matchUrl(url: string, rule: string): boolean {
  return (matchUrlWildcard as unknown as (url: string, rule: string) => boolean)(url, rule);
}
