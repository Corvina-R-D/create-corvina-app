export * from "../docs/index"

export const getI18nMessages = async (brand: string) => (await import(`./${brand}/index.ts`) ).messages
