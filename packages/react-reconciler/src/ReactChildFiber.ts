import { createFiberFromElement } from "./ReactFiber";

import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { Placement } from "./ReactFiberFlags";
import { ReactElement } from "shared/ReactTypes";
import { isArray } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";


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
            newFiber.flags |= Placement; // 是否添加到dom的标记
        }
        return newFiber;
    }
    // 协调单个⼦节点 协调单个节点，对于⻚⾯初次渲染，创建fiber，不涉及对比复⽤老节点
    function reconcileSingleElement(
        returnFiber: Fiber,
        currentFirstChild: Fiber | null,
        newChild: ReactElement
    ) {
        // 初次渲染
        const createdFiber = createFiberFromElement(newChild);
        createdFiber.return = returnFiber;
        return createdFiber;
        // 新老 vdom diff
    }


    function createChild(returnFiber: Fiber, newChild: any) {
        if (typeof newChild === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    const createdFiber = createFiberFromElement(newChild);
                    createdFiber.return = returnFiber;
                    return createdFiber;
            }
        }
    }
    function reconcileChildrenArray(
        returnFiber: Fiber,
        currentFirstChild: Fiber | null,
        newChildren: Array<any>
    ) {
        // 第一个fiber
        let resultingFirstChild: Fiber | null = null;
        let previousNewFiber: Fiber | null = null;
    
        let oldFiber = currentFirstChild;
    
        let newIdx = 0;
    
        if (oldFiber === null) {
            for (; newIdx < newChildren.length; newIdx++) {
                const newFiber = createChild(returnFiber, newChildren[newIdx]);
                if (newFiber === null) {
                    continue;
                }
    
                newFiber.index = newIdx;
                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber;
                } else {
                    previousNewFiber.sibling = newFiber;
                }
                previousNewFiber = newFiber;
    
            }
            return resultingFirstChild;
        }
        return resultingFirstChild;
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

        // 数组形式
        if (isArray(newChild)) {
            return reconcileChildrenArray(returnFiber, currentFirstChild, newChild)
        }
        return null;
    }
    // todo 数组、⽂本
    return reconcileChildFibers;
}