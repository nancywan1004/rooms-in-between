/**
 * Quiet Dread / Corporate Absurdity palette (docs/style.png)
 * Dominant: concrete / warm gray / steel blue
 * Accents: dusty sage, paper white; sparse blush / lilac / coral
 */
export const PALETTE = {
  MAT_CREAM: 0xe4ddd2,
  MAT_WARM_WHITE: 0xefeae2,
  MAT_SAGE: 0x8a9a86,
  MAT_DUSTY_BLUE: 0x6d7f92,
  MAT_CORAL: 0xc4887a,
  MAT_LAVENDER_GREY: 0x9a95a0,
  MAT_CHARCOAL: 0x2c2a2a,
  MAT_GOLD: 0xb89a6a,
  MAT_GLASS: 0xa8b8c4,
  MAT_FLOOR: 0x7a746c,
  MAT_CEILING: 0xd8d4cc,
  MAT_WALL: 0xd2cdc4,
  MAT_ACCENT_PRINTER: 0x5e7084,
  MAT_ACCENT_BREAK: 0x7a8e74,
  MAT_ACCENT_MANAGER: 0x2a2826,
  MAT_ACCENT_MEETING: 0xa87868,
  MAT_DESK: 0xc4b8a4,
  MAT_CHAIR: 0x4a5560,
  MAT_PLANT: 0x5a7354,
  MAT_POT: 0x8a8074,
  MAT_NPC: 0x9a948c,
  MAT_MANAGER: 0x1e1c1c,
  // Extra tokens for Quiet Dread
  MAT_CONCRETE: 0x9a9590,
  MAT_STEEL: 0x6a7684,
  MAT_BEIGE_TECH: 0xc8c0b0,
  MAT_SCREEN: 0x1a2820,
  MAT_BLUSH: 0xd4a8a8,
  MAT_LILAC: 0xb0a4b8,
  MAT_PAPER: 0xf0ebe4,
  MAT_BASEBOARD: 0x5a5854,
} as const

export type PaletteKey = keyof typeof PALETTE
