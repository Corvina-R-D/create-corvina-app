import { matchUrl } from './matchUrl';

describe('matchUrl', () => {
  it("I can match a url with a rule 'google.com'", () => {
    const rule = 'google.com';

    expect(matchUrl('google.com.uk', rule)).toBeFalsy();
    expect(matchUrl('docs.google.com', rule)).toBeFalsy();
    expect(matchUrl('http://docs.google.com', rule)).toBeFalsy();
    expect(matchUrl('https://docs.google.com', rule)).toBeFalsy();
    expect(matchUrl('www.docs.google.com', rule)).toBeFalsy();
    expect(matchUrl('http://docs.ggoogle.com', rule)).toBeFalsy();
    expect(matchUrl('http://goooogle.com', rule)).toBeFalsy();
    expect(matchUrl('gogoogle.com', rule)).toBeFalsy();
    expect(matchUrl('http://google.com', rule)).toBeTruthy();
    expect(matchUrl('https://google.com', rule)).toBeTruthy();
    expect(matchUrl('https://google.com/', rule)).toBeTruthy();
    expect(matchUrl('google.com/', rule)).toBeTruthy();
  });

  it("I can match a url with a rule '*.google.com' or '.google.com'", () => {
    ['.google.com', '*.google.com'].forEach((rule) => {
      expect(matchUrl('google.com.uk', rule)).toBeFalsy();
      expect(matchUrl('docs.google.com', rule)).toBeTruthy();
      expect(matchUrl('http://docs.google.com', rule)).toBeTruthy();
      expect(matchUrl('https://docs.google.com', rule)).toBeTruthy();
      expect(matchUrl('www.docs.google.com', rule)).toBeTruthy();
      expect(matchUrl('http://www.docs.google.com', rule)).toBeTruthy();
      expect(matchUrl('http://docs.ggoogle.com', rule)).toBeFalsy();
      expect(matchUrl('http://goooogle.com', rule)).toBeFalsy();
      expect(matchUrl('gogoogle.com', rule)).toBeFalsy();
      expect(matchUrl('http://google.com', rule)).toBeFalsy();
      expect(matchUrl('https://google.com', rule)).toBeFalsy();
      expect(matchUrl('https://google.com/', rule)).toBeFalsy();
      expect(matchUrl('google.com/', rule)).toBeFalsy();
    });
  });

  it('Equal urls match', () => {
    expect(matchUrl('google.com', 'google.com')).toBeTruthy();
    expect(matchUrl('http://google.com', 'http://google.com')).toBeTruthy();
    expect(matchUrl('https://google.com', 'https://google.com')).toBeTruthy();
    expect(matchUrl('https://google.com/', 'https://google.com/')).toBeTruthy();
    expect(matchUrl('https://exor.app.corvina.io', 'https://exor.app.corvina.io')).toBeTruthy();
    expect(matchUrl('google.com/', 'google.com/')).toBeTruthy();
  });
});
