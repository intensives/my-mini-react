import { createFiberFromElement, createFiberFromText, createWorkInProgress } from "./ReactFiber";

import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
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


function useFiber(fiber: Fiber, pendingProps: any) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
}
// wrapper function
function createChildReconciler(shouldTrackSideEffects: boolean) {
    function deleteChild(returnFiber: Fiber, childToDelete: Fiber) {
        const deletions = returnFiber.deletions;
        if (!shouldTrackSideEffects) {
            // 初次渲染
            return;
        }
        if (deletions === null) {
            returnFiber.deletions = [childToDelete];
            returnFiber.flags |= ChildDeletion;
        } else {
            returnFiber.deletions!.push(childToDelete);
        }
    }

    function deleteRemainingChildren(returnFiber: Fiber, currentFirstChild: Fiber) {
        let childToDelete = currentFirstChild;
        while (childToDelete !== null) {
            deleteChild(returnFiber, childToDelete);
            childToDelete = childToDelete.sibling;
        }

        return null;
    }
    // 标记为dom节点
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
        element: ReactElement
    ) {
        // 更新，节点复用的条件 同一层级、key相同、类型相同 
        const key = element.key;
        let child = currentFirstChild;

        while (child !== null) {
            if (child.key === key) {
                const elementType = element.type;
                if (child.elementType === elementType) {
                    // todo 后面其他fiber可以删除？？？ 不是引用吗
                    const existing = useFiber(child, element.props);
                    existing.return = returnFiber;
                    return existing;
                } else {
                    // 前提条件 如果多个相同的key react否定这种情况 
                    deleteRemainingChildren(returnFiber, child);
                    break;
                }
            } else {
                // 删除单个节点
                // ？？？ 如果child不能复用，删除 但是它是一个列表，第一个不能对应上第二个可以吧 重构fiber树？ 
                // ans react设计理念 启发式
                deleteChild(returnFiber, child);
            }
            child = child.sibling; // 继续遍历
        }
        // 初次渲染
        const createdFiber = createFiberFromElement(element);
        createdFiber.return = returnFiber;
        return createdFiber;
        // 新老 vdom diff
    }
    // 协调单个⽂本节点
    function reconcileSingleTextNode(
        returnFiber: Fiber,
        currentFirstChild: Fiber | null,
        textContent: string
    ) {
        const createdFiber = createFiberFromText(textContent);
        createdFiber.return = returnFiber;
        return createdFiber;
    }


    function createChild(returnFiber: Fiber, newChild: any) {
        if (isText(newChild)) {
            const createdFiber = createFiberFromText(newChild + "");
            createdFiber.return = returnFiber;
            return createdFiber;
        }
        if (typeof newChild === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    const createdFiber = createFiberFromElement(newChild);
                    createdFiber.return = returnFiber;
                    return createdFiber;
            }
        }
        return null;
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
            // 链表
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
        // 文本节点
        if (isText(newChild)) {
            return placeSingleChild(
                reconcileSingleTextNode(returnFiber, currentFirstChild, newChild + "")
            );
        }
        // 单个节点、数组
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

function isText(newChild: any) {
    return (
        (typeof newChild === "string" && newChild !== "") ||
        typeof newChild === "number"
    );
}