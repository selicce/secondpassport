/**
 * Client-safe demo flag. NEXT_PUBLIC_DEMO_MODE is inlined at build time, so this
 * works in both client and server components. Client components use it to keep
 * the simulated interactions in demo mode and call real server actions in prod.
 */
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
