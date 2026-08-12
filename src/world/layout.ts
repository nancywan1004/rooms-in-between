/** Layout config — desks, pressure slots, manager waypoints */

export type DeskPlacement = {
  x: number
  z: number
  rotation: number
}

export type Waypoint = { x: number; z: number }

/**
 * Open Office desk islands — leave central aisle + 4 directional paths clear.
 *
 *   Island NW (-4,-2)     Island NE (4,-2)
 *              MAIN PATH (z≈0)
 *   Island SW (-4, 2.5)   Island SE (3.5, 2.5) — SE thinner for elevator
 */
export const officeLayout = {
  desks: [
    // Island NW — facing east (+X / toward center-ish)
    { x: -5.0, z: -3.2, rotation: Math.PI / 2 },
    { x: -5.0, z: -1.8, rotation: Math.PI / 2 },
    { x: -3.4, z: -3.2, rotation: -Math.PI / 2 },
    { x: -3.4, z: -1.8, rotation: -Math.PI / 2 },

    // Island NE
    { x: 3.4, z: -3.2, rotation: Math.PI / 2 },
    { x: 3.4, z: -1.8, rotation: Math.PI / 2 },
    { x: 5.0, z: -3.2, rotation: -Math.PI / 2 },
    { x: 5.0, z: -1.8, rotation: -Math.PI / 2 },

    // Island SW
    { x: -5.0, z: 1.8, rotation: Math.PI / 2 },
    { x: -5.0, z: 3.2, rotation: Math.PI / 2 },
    { x: -3.4, z: 1.8, rotation: -Math.PI / 2 },
    { x: -3.4, z: 3.2, rotation: -Math.PI / 2 },

    // Island SE (smaller — leave elevator path at -3.5, 5)
    { x: 3.2, z: 2.0, rotation: Math.PI / 2 },
    { x: 3.2, z: 3.4, rotation: Math.PI / 2 },
    { x: 4.8, z: 2.0, rotation: -Math.PI / 2 },
    { x: 4.8, z: 3.4, rotation: -Math.PI / 2 },
  ] as DeskPlacement[],

  /** Hidden placement slots for PRESSURE desk spawn — not instantiated yet */
  pressureDeskSlots: [
    { x: -1.2, z: -4.2, rotation: 0 },
    { x: 1.2, z: -4.2, rotation: 0 },
    { x: -2.0, z: -0.2, rotation: Math.PI / 2 },
    { x: 2.0, z: -0.2, rotation: -Math.PI / 2 },
    { x: -1.0, z: 1.0, rotation: 0 },
    { x: 1.0, z: 1.0, rotation: Math.PI },
    { x: -6.0, z: -4.5, rotation: Math.PI / 2 },
    { x: 6.0, z: -4.5, rotation: -Math.PI / 2 },
    { x: -6.0, z: 0.5, rotation: Math.PI / 2 },
    { x: 6.0, z: 0.5, rotation: -Math.PI / 2 },
    { x: -2.5, z: 4.5, rotation: 0 },
    { x: 1.5, z: 4.5, rotation: Math.PI },
    { x: -0.5, z: -2.5, rotation: Math.PI / 4 },
    { x: 0.5, z: 2.5, rotation: -Math.PI / 4 },
    { x: -4.0, z: 0.0, rotation: 0 },
    { x: 4.0, z: 0.0, rotation: Math.PI },
    { x: -1.8, z: -1.2, rotation: Math.PI / 2 },
    { x: 1.8, z: 1.2, rotation: -Math.PI / 2 },
  ] as DeskPlacement[],

  /**
   * Manager patrol loop (Spec §16):
   * Manager Office → North Open → Central → Printer → Central → Break → Manager
   */
  managerWaypoints: [
    { x: 0, z: -10 },
    { x: 0, z: -7.5 },
    { x: 0, z: -4 },
    { x: 0, z: 0 },
    { x: -6, z: 0 },
    { x: -8.5, z: 0 },
    { x: -6, z: 0 },
    { x: 0, z: 0 },
    { x: 6, z: 0 },
    { x: 8.5, z: 0 },
    { x: 6, z: 0 },
    { x: 0, z: 0 },
    { x: 0, z: -4 },
    { x: 0, z: -7.5 },
  ] as Waypoint[],

  spawn: { x: -3.5, z: 5, yaw: Math.PI },
}

export const ROOM = {
  open: { x0: -7, x1: 7, z0: -6, z1: 6, h: 3.4 },
  printer: { cx: -10.5, cz: 0, w: 6, d: 7, h: 3.0 },
  break: { cx: 10.5, cz: 0, w: 6, d: 7, h: 3.0 },
  manager: { cx: 0, cz: -10, w: 8, d: 6, h: 4.0 },
  meeting: { cx: 0, cz: 10.5, w: 10, d: 8, h: 4.5 },
  wallT: 0.2,
  doorW: 1.1,
  doorH: 2.2,
} as const
