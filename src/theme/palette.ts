/** Unified material color tokens — Pastel Stylized Corporate Liminalism */
export const PALETTE = {
  MAT_CREAM: 0xf3ebe0,
  MAT_WARM_WHITE: 0xf7f4ef,
  MAT_SAGE: 0xa8b89a,
  MAT_DUSTY_BLUE: 0x8a9aab,
  MAT_CORAL: 0xd4a08a,
  MAT_LAVENDER_GREY: 0xb8b4bc,
  MAT_CHARCOAL: 0x3a3634,
  MAT_GOLD: 0xc4a574,
  MAT_GLASS: 0xc8d8e8,
  MAT_FLOOR: 0xe8e0d4,
  MAT_CEILING: 0xf0ebe4,
  MAT_WALL: 0xf5f0e8,
  MAT_ACCENT_PRINTER: 0x7a8fa3,
  MAT_ACCENT_BREAK: 0x8fa382,
  MAT_ACCENT_MANAGER: 0x4a4540,
  MAT_ACCENT_MEETING: 0xc4907a,
  MAT_DESK: 0xd9cfc0,
  MAT_CHAIR: 0x6b7a8a,
  MAT_PLANT: 0x6f8f6a,
  MAT_POT: 0xc4b8a8,
  MAT_NPC: 0xc8c0b8,
  MAT_MANAGER: 0x2e2a28,
} as const

export type PaletteKey = keyof typeof PALETTE
