export const generateProjectName = (instanceId: string, organizationId: string) => `${instanceId}_${organizationId}`;

export const parseProjectName = (projectName: string) => {
  if (!projectName) {
    return { instanceId: undefined, organizationId: undefined };
  }

  const [instanceId, organizationId] = projectName.split('_');

  return { instanceId, organizationId };
};
