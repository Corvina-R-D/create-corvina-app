const ENABLE_CHARACTERS = 'abcdefghijklmnopqrstuvwxyz0123456789.-_';
const containsValidCharacters = (input: string): boolean => {
  return input.split('').every((char) => ENABLE_CHARACTERS.includes(char));
};
const getCommonValidationFn =
  (maxLength: number) =>
  (project: string): boolean => {
    if (project.length > maxLength || project.length < 2) {
      return false;
    }

    if (
      project.startsWith('-') ||
      project.endsWith('-') ||
      project.startsWith('_') ||
      project.endsWith('_') ||
      project.startsWith('.') ||
      project.endsWith('.')
    ) {
      return false;
    }

    if (!containsValidCharacters(project)) {
      return false;
    }

    return true;
  };

export const validateProjectName = getCommonValidationFn(255);
export const validateRepositoryName = getCommonValidationFn(255);
export const validateTagName = getCommonValidationFn(128);
