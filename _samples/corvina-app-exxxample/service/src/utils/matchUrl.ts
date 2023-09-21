import * as matchUrlWildcard from 'match-url-wildcard';

export function matchUrl(url: string, rule: string): boolean {
  return (matchUrlWildcard as any)(url, rule);
}
