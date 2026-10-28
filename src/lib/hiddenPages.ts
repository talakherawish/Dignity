import { useQuery } from "@tanstack/react-query";
import type { PayloadSiteSettings } from "./payload";
import { siteSettingsQuery } from "./queries";

/**
 * Pages an editor keeps off the site until they have content, each with its
 * switch in Site Settings. Off unless switched on -- also when Site Settings
 * can't be reached. A hidden page drops out of the menu and the hub pages,
 * and its address answers "not found".
 */
const SWITCHES: Record<string, string> = { "/publications/stickers": "showStickers" };

export const isPageShown = (path: string, settings: PayloadSiteSettings | null | undefined) =>
  !(path in SWITCHES) || settings?.[SWITCHES[path]] === true;

export function usePageShown() {
  const { data } = useQuery(siteSettingsQuery);
  return (path: string) => isPageShown(path, data);
}
