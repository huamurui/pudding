/** Keep the complete ancestor chain while any nested popup or its source link is hovered. */
export function activePreviewCount(popups: Array<{ isHovered: boolean; isLinkHovered: boolean }>): number {
  for (let index = popups.length - 1; index >= 0; index--) {
    if (popups[index].isHovered || popups[index].isLinkHovered) return index + 1
  }
  return 0
}
