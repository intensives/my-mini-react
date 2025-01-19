import type { Fiber } from "react-reconciler/src/ReactInternalTypes";

type BaseSyntheticEvent = {
  isPersistent: () => boolean;
  isPropagationStopped: () => boolean;
  _targetInst: Fiber;
  nativeEvent: Event;
  target?: any;
  relatedTarget?: any;
  type: string;
  currentTarget: null | EventTarget;
};

// react内有的事件
export type KnownReactSyntheticEvent = BaseSyntheticEvent & {
  _reactName: string;
};

// react没有的事件
export type UnknownReactSyntheticEvent = BaseSyntheticEvent & {
  _reactName: null;
};

export type ReactSyntheticEvent =
  | KnownReactSyntheticEvent
  | UnknownReactSyntheticEvent;
