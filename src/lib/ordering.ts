/**
 * The order cards take in every grid on the site: landscape items first, then
 * portrait, and newest first within each. Inside a publications page this
 * applies within each research line's group, not across the page. Items with
 * no date go after dated ones of the same shape; ties keep the order they came
 * in.
 */
export function landscapeFirst<T>(
  items: T[],
  isLandscape: (item: T) => boolean,
  dateOf: (item: T) => string | undefined,
): T[] {
  const time = (item: T) => {
    const date = dateOf(item);
    const value = date ? Date.parse(date) : NaN;
    return Number.isNaN(value) ? -Infinity : value;
  };
  return items
    .map((item, index) => ({ item, index, landscape: isLandscape(item), time: time(item) }))
    .sort(
      (a, b) =>
        Number(b.landscape) - Number(a.landscape) ||
        (b.time === a.time ? 0 : b.time > a.time ? 1 : -1) ||
        a.index - b.index,
    )
    .map(({ item }) => item);
}

/** Wider than tall. Unknown proportions count as portrait, the shape of a page. */
export const isLandscapeSize = (width?: number, height?: number) =>
  !!width && !!height && width > height;
