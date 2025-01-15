export type Flags = number;

export const NoFlags = /*                                 */ 0b0000000000000000000000000000000;
export const Placement = /*                               */ 0b0000000000000000000000000000010;
export const Update = /*                                  */ 0b0000000000000000000000000000100; // 4
export const ChildDeletion = /*                           */ 0b0000000000000000000000000001000;
export const Passive = /*                                 */ 0b0000000000000000000100000000000; // 2048