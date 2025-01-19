import type { EventPriority } from "react-reconciler/src/ReactEventPriorities";
import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  getCurrentUpdatePriority,
  IdleEventPriority,
  setCurrentUpdatePriority,
} from "react-reconciler/src/ReactEventPriorities";
import type { DOMEventName } from "./DOMEventNames";
import * as Scheduler from "scheduler";
import {
  IdlePriority,
  ImmediatePriority,
  LowPriority,
  NormalPriority,
  UserBlockingPriority,
} from "scheduler/src/SchedulerPriorities";
import { EventSystemFlags, IS_CAPTURE_PHASE } from "./EventSystemFlags";
import { AnyNativeEvent, DispatchListener, DispatchQueue, extractEvents } from "./DOMPluginEventSystem";
import { invokeGuardedCallbackAndCatchFirstError } from "shared/ReactErrorUtils";
import { getClosestInstanceFromNode } from "../client/ReactDOMComponentTree";
import { ReactSyntheticEvent } from "./ReactSyntheticEventType";
import { Fiber } from "react-reconciler/src/ReactInternalTypes";

export function createEventListenerWrapperWithPriority(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: number
): Function {
  // 根据事件名称，获取优先级。比如click、input、drop等对应DiscreteEventPriority，drag、scroll等对应ContinuousEventPriority，
  // message也许处于Scheduler中，根据getCurrentSchedulerPriorityLevel()获取优先级。其它是DefaultEventPriority。
  const eventPriority = getEventPriority(domEventName);
  let listenerWrapper;
  switch (eventPriority) {
    case DiscreteEventPriority:
      listenerWrapper = dispatchDiscreteEvent;
      break;
    case ContinuousEventPriority:
      listenerWrapper = dispatchContinuousEvent;
      break;
    case DefaultEventPriority:
    default:
      listenerWrapper = dispatchEvent;
      break;
  }
  // 绑定参数 有四个参数，但是只绑定一个三个参数，还有一个dom节点
  return listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer
  );
}

// 不同的事件派发方法 入口函数
function dispatchDiscreteEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  container: EventTarget,
  nativeEvent: AnyNativeEvent
) {
  // ! 1.记录上一次的优先级
  const previousPriority = getCurrentUpdatePriority();
  try {
    // !2.设置当前事件优先级
    setCurrentUpdatePriority(DiscreteEventPriority);
    // !3.调用dispatchEvent, 执行事件
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    //!4.恢复
    setCurrentUpdatePriority(previousPriority);
  }
}

// 和上面流程一样，区别在于类型不同
function dispatchContinuousEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  container: EventTarget,
  nativeEvent: AnyNativeEvent
) {
  // ! 1.记录上一次的优先级
  const previousPriority = getCurrentUpdatePriority();
  try {
    // !2.设置当前事件优先级
    setCurrentUpdatePriority(ContinuousEventPriority);
    // !3.调用dispatchEvent, 执行事件
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    //!4.恢复
    setCurrentUpdatePriority(previousPriority);
  }
}

function dispatchEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  targetContainerer: EventTarget,
  nativeEvent: AnyNativeEvent
) {
  const nativeEventTarget = nativeEvent.target;

  const return_targetInst = getClosestInstanceFromNode(nativeEventTarget);
  const dispatchQueue: DispatchQueue = []; // 派发事件队列

  // 给dispatchQueue添加事件
  //   dispatchQueue: 这是一个派发事件队列，用于存储从原生事件中提取出来的 React 事件。这些事件将在稍后被处理和分发。
  // domEventName: 这是原生事件的名称，例如 'click'、'keydown' 等。这个参数用于确定应该提取哪些类型的事件。
  // targetInst: 这是触发事件的 React 组件实例（即 Fiber 节点）。这个参数用于确定事件应该分发给哪个组件。
  // nativeEvent: 这是原生事件对象，包含了事件的详细信息，例如事件类型、目标元素、鼠标位置等。这个参数用于提取事件的相关信息。
  // nativeEventTarget: 这是原生事件的目标元素，即事件最初发生的 DOM 元素。这个参数用于确定事件的来源。
  // eventSystemFlags: 这是事件系统标志，用于指定事件的阶段（捕获或冒泡）。这个参数用于确定事件监听器应该在哪个阶段被调用。
  // targetContainer: 这是目标容器，通常是一个 DOM 元素，用于确定事件的传播范围。这个参数用于确保事件监听器在正确的容器内被调用。
  extractEvents(
    dispatchQueue,
    domEventName,
    return_targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainerer
  )
  if (dispatchQueue.length !== 0) {

    console.log('%c [  ]-124', 'font-size:13px; background:pink; color:#bf2c9f;',)
  }
  processDispatchQueue(dispatchQueue, eventSystemFlags);
}

export function processDispatchQueue(
  dispatchQueue: DispatchQueue,
  eventSystemFlags: EventSystemFlags
): void {
  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  for (let i = 0; i < dispatchQueue.length; i++) {
    const { event, listeners } = dispatchQueue[i];
    processDispatchQueueItemsInOrder(event, listeners, inCapturePhase);
  }
}

// 捕捉阶段和冒泡阶段的事件处理
function processDispatchQueueItemsInOrder(
  event: ReactSyntheticEvent,
  dispatchListeners: Array<DispatchListener>,
  inCapturePhase: boolean
): void {
  // 事件顺序从下（子节点）往上（父节点）
  let prevInstance: Fiber | null = null
  if (inCapturePhase) {
    // 捕获阶段，从上往下执行
    for (let i = dispatchListeners.length - 1; i >= 0; i--) {
      const { instance, currentTarget, listener } = dispatchListeners[i];
      if (prevInstance !== instance && event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
      prevInstance = instance;
    }
  } else {
    for (let i = 0; i < dispatchListeners.length; i++) {
      const { instance, currentTarget, listener } = dispatchListeners[i];
      if (prevInstance !== instance && event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
      prevInstance = instance;
    }
  }
}

function executeDispatch(
  event: ReactSyntheticEvent,
  listener: Function,
  currentTarget: EventTarget
): void {

  console.log('%c [  ]-167', 'font-size:13px; background:pink; color:#bf2c9f;', event)
  const type = event.type || "unknown-event";
  // event.currentTarget = currentTarget;
  invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
  // event.currentTarget = null;
}

export function getEventPriority(domEventName: DOMEventName): EventPriority {
  switch (domEventName) {
    // Used by SimpleEventPlugin:
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    // Used by polyfills: (fall through)
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    // Only enableCreateEventHandleAPI: (fall through)
    case "beforeblur":
    case "afterblur":
    // Not used by React but could be by user code: (fall through)
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return DiscreteEventPriority;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    // Not used by React but could be by user code: (fall through)
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return ContinuousEventPriority;
    case "message": {
      // 我们可能在调度器回调中。
      // 最终，这种机制将被替换为检查本机调度器上的当前优先级。
      const schedulerPriority = Scheduler.getCurrentPriorityLevel();
      switch (schedulerPriority) {
        case ImmediatePriority:
          return DiscreteEventPriority;
        case UserBlockingPriority:
          return ContinuousEventPriority;
        case NormalPriority:
        case LowPriority:
          return DefaultEventPriority;
        case IdlePriority:
          return IdleEventPriority;
        default:
          return DefaultEventPriority;
      }
    }
    default:
      return DefaultEventPriority;
  }
}
