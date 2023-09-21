import { validateRepositoryName } from './openContainerValidation';

describe('validateRepositoryName', () => {
  it('name with 1 char', () => {
    expect(validateRepositoryName('a')).toBeFalsy();
  });

  it('name with 2 chars', () => {
    expect(validateRepositoryName('aa')).toBeTruthy();
  });

  it('name with more 2 chars', () => {
    expect(validateRepositoryName('012345678910')).toBeTruthy();
  });

  it('name with length up to 255 chars', () => {
    expect(
      validateRepositoryName(
        '012345678910012345678910012345678910012345678910012345678910012345678910012345678910012345678910012345678910012345678910012345678910012345678910012345678910012345678910012345678910012345678910012345678910012345678910012345678910012345678910012345678910012'
      )
    ).toBeTruthy();
  });

  it('name with more than 255 chars', () => {
    expect(
      validateRepositoryName(
        '0123456789100123456789100123456789100123456789100123456789100123456789100123456789100123456789100123456789100123456789100123456789100123456789100123456789100123456789100123456789100123456789100123456789100123456789100123456789100123456789100123456789100123'
      )
    ).toBeFalsy();
  });
});
