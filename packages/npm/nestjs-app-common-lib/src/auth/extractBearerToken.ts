/** the token of an Authorization header; the Bearer scheme is case insensitive (RFC 7235), a header without it is returned as is */
export const extractBearerToken = (authorization?: string) => {
  const match = authorization?.match(/^bearer +(.+)$/i);

  return match ? match[1] : authorization;
};
