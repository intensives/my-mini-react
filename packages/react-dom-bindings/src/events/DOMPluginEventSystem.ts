import { DOMEventName } from "./DOMEventNames";
import { addEventBubbleListener, addEventCaptureListener } from "./EventListener";
import * as SimpleEventPlugin from "./plugins/SimpleEventPlugin";
import { allNativeEvents } from "./EventRegistry";
import { EventSystemFlags, IS_CAPTURE_PHASE } from "./EventSystemFlags";
import { createEventListenerWrapperWithPriority } from "./ReactDOMEventListener";
import type { Fiber } from "react-reconciler/src/ReactInternalTypes";
import { HostComponent } from "react-reconciler/src/ReactWorkTags";
import getListener  from "./getListener";

export type AnyNativeEvent = Event | KeyboardEvent | MouseEvent | TouchEvent;

export type DispatchListener = {
    instance: null | Fiber;
    listener: Function;
    currentTarget: EventTarget;
};
type DispatchEntry = {
    event: AnyNativeEvent;
    listeners: Array<DispatchListener>;
};
export type DispatchQueue = Array<DispatchEntry>;
SimpleEventPlugin.registerEvents();
// EnterLeaveEventPlugin.registerEvents();
// ChangeEventPlugin.registerEvents();
// SelectEventPlugin.registerEvents();
// BeforeEventPlugin.registerEvents();

export function extractEvents(
    dispatchQueue: DispatchQueue,
    domEventName: DOMEventName,
    targetInst: null | Fiber,
    nativeEvent: AnyNativeEvent,
    nativeEventTarget: null | EventTarget,
    eventSystemFlags: EventSystemFlags,
    targetContainer: EventTarget
) {
    SimpleEventPlugin.extractEvents(
        dispatchQueue,
        domEventName,
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags,
        targetContainer
    );
}
// 需要分别附加到媒体元素的事件列表。
export const mediaEventTypes: Array<DOMEventName> = [
    "abort",
    "canplay",
    "canplaythrough",
    "durationchange",
    "emptied",
    "encrypted",
    "ended",
    "error",
    "loadeddata",
    "loadedmetadata",
    "loadstart",
    "pause",
    "play",
    "playing",
    "progress",
    "ratechange",
    "resize",
    "seeked",
    "seeking",
    "stalled",
    "suspend",
    "timeupdate",
    "volumechange",
    "waiting",
];

// 我们不应该将这些事件委托给容器，⽽是应该直接在实际的⽬标元素上设置它们。这主要是因
export const nonDelegatedEvents: Set<DOMEventName> = new Set([
    "cancel",
    "close",
    "invalid",
    "load",
    "scroll",
    "scrollend",
    "toggle",
    // 注意："error" 事件并不是⼀个独占的媒体事件，也可能发⽣在其他元素上。我们不会重
    ...mediaEventTypes,
]);


const listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);
// 先逐渐注册入口函数
export function listenToAllSupportedEvents(rootContainerElement: EventTarget) {

    // 防止重复绑定 组件复用防止重复绑定
    if (!(rootContainerElement as any)[listeningMarker]) {
        (rootContainerElement as any)[listeningMarker] = true;
        // 绑定事件
        allNativeEvents.forEach((domEventName) => {
            if (domEventName !== "selectionchange") {
                // ! 一个事件有两个阶段，捕获和冒泡
                // 冒泡
                if (!nonDelegatedEvents.has(domEventName)) {
                    listenToNativeEvent(domEventName, false, rootContainerElement);
                }
                // 捕获
                listenToNativeEvent(domEventName, true, rootContainerElement);
            }
        })
    }
}

export function listenToNativeEvent(
    domEventName: DOMEventName,
    isCapturePhaseListener: boolean,
    target: EventTarget
): void {
    let eventSystemFlags = 0;
    if (isCapturePhaseListener) {
        eventSystemFlags |= IS_CAPTURE_PHASE;
    }
    addTrappedEventListener(
        target,
        domEventName,
        eventSystemFlags,
        isCapturePhaseListener
    )
}

function addTrappedEventListener(
    targetContainer: EventTarget,
    domEventName: DOMEventName,
    eventSystemFlags: number,
    isCapturePhaseListener: boolean
) {
    // !获取带有优先级的对应事件
    let listener = createEventListenerWrapperWithPriority(
        targetContainer,
        domEventName,
        eventSystemFlags
    );

    // ! 2. 事件绑定
    if (isCapturePhaseListener) {
        // 捕获
        addEventCaptureListener(targetContainer, domEventName, listener);
    } else {
        // 冒泡
        addEventBubbleListener(targetContainer, domEventName, listener);
    }
}

// 从指定的 targetFiber 开始，沿着 Fiber 树向上遍历，收集与指定事件类型（reactName）和事件阶段（inCapturePhase）相关的事件监听器。
// 这个函数主要用于在 React 的事件系统中，为特定的事件类型和阶段收集所有相关的事件监听器。
export function accumulateSinglePhaseListeners(
    targetFiber: Fiber | null,
    reactName: string | null,
    nativeEventType: string,
    inCapturePhase: boolean,
    accumulateTargetOnly: boolean,
    nativeEvent: AnyNativeEvent
): Array<DispatchListener> {
    const captureName = reactName !== null ? reactName + "Capture" : null;
    // 根据inCapturePhase查找对应的事件名
    const reactEventName = inCapturePhase ? captureName : reactName;
    let listeners: Array<DispatchListener> = [];

    let instance = targetFiber;

    // 通过target -> root累积所有fiber和listeners。
    while (instance !== null) {
        const { stateNode, tag } = instance;
        // 处理位于HostComponents（即 <div> 元素）上的listeners
        if (tag === HostComponent) {
            // 标准 React on* listeners, i.e. onClick or onClickCapture
            const listener = getListener(instance, reactEventName as string);
            if (listener != null) {
                listeners.push({
                    instance,
                    listener,
                    currentTarget: stateNode,
                });
            }
        }
        // 如果只是为target累积事件，那么我们就不会继续通过 React Fiber 树传播以查找其它listeners。
        if (accumulateTargetOnly) {
            break;
        }

        instance = instance.return;
    }
    return listeners;
}