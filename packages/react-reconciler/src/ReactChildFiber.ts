import { createFiberFromElement } from "./ReactFiber";

import { Fiber } from "./ReactInternalTypes";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { Placement } from "./ReactFiberFlags";
import { ReactElement } from "shared/ReactTypes";


type ChildReconciler = (
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any
) => Fiber | null;

export const reconcileChildFibers: ChildReconciler = createChildReconciler(true);
export const mountChildFibers: ChildReconciler = createChildReconciler(false);

// wrapper function
function createChildReconciler(shouldTrackSideEffects: boolean) {
    function placeSingleChild(newFiber: Fiber) {
        if (shouldTrackSideEffects && newFiber.alternate === null) {
            newFiber.flags |= Placement;
        }
        return newFiber;
    }
    // 协调单个⼦节点
    function reconcileSingleElement(
        returnFiber: Fiber,
        currentFirstChild: Fiber | null,
        newChild: ReactElement
    ) {
        // 初次渲染
        const created = createFiberFromElement(newChild);
        created.return = returnFiber;
        return created;
        // 新老 vdom diff
    }
    function reconcileChildFibers(
        returnFiber: Fiber,
        currentFirstChild: Fiber | null,
        newChild: any
    ) {
        // 单个节点、数组、⽂本
        if (typeof newChild === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild));
            }
        }
        return null;
    }
    // todo 数组、⽂本
    return reconcileChildFibers;
}