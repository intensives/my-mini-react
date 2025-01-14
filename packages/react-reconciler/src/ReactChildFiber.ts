import { createFiberFromElement, createFiberFromText, createWorkInProgress } from "./ReactFiber";

import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import { ReactElement } from "shared/ReactTypes";
import { isArray } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";
import { HostText } from "./ReactWorkTags";


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

    function updateTextNode(
        returnFiber: Fiber,
        current: Fiber | null,
        textContent: string
    ) {
        if (current == null || current.tag !== HostText) {
            // 老节点不是文本
            const created = createFiberFromText(textContent);
            created.return = returnFiber;
            return created;
        } else {
            const existing = useFiber(current!, textContent);
            existing.return = returnFiber;
            return existing;
        }
    }

    function updateElement(
       returnFiber: Fiber,
       current: Fiber | null,
       element: ReactElement 
    ) {
        const elementType = element.type;
        if (current !== null) {
            if (current.elementType === elementType) {
               // 可以复用
                const existing = useFiber(current, element.props);
                existing.return = returnFiber;
                return existing; 
            }
        }
        // 不可以复用
        const created = createFiberFromElement(element);
        created.return = returnFiber;
        return created;
    }

    function updateSlot(
        returnFiber: Fiber,
        oldFiber: Fiber | null,
        newChild: any
    ) {
        // 判断是否可以复用
        const key = oldFiber !== null ? oldFiber.key : null;
        if (isText(newChild)) {
            if (key !== null) {
                // 新节点是文本，老节点不是问题 文本没有key
                return null;
            }
            // 有可能可以复用
            return updateTextNode(returnFiber, oldFiber, "" + newChild);
        }

        if ( typeof newChild === "object" && newChild !== null) {
            if (newChild.key === key) {
                // 进入下一个判断
               return updateElement(returnFiber, oldFiber, newChild); 
            } else {
                return null;
            }
        }

        return null;
    }

    function placeChild(
        newFiber: Fiber,
        lastPlacedIndex: number, // 记录上一个fiber在老fiber上位置
        newIdx: number
    ){
        newFiber.index = newIdx;

        if (!shouldTrackSideEffects) {
            return lastPlacedIndex;
        }
        // 判断节点位置是否发送相对位置变化， 是否需要移动
        const current = newFiber.alternate;

        if (current !== null) {
            const oldIndex = current.index;
            if (oldIndex < lastPlacedIndex) {
                // 需要移动
                newFiber.flags |= Placement;
                return lastPlacedIndex;
            } else {
                // 不需要移动
                return oldIndex;
            }
        } else {
            // 节点新增
            newFiber.flags |= Placement;
            return lastPlacedIndex;
        }
    }

    // 构建fiber map
    function mapRemainingChildren(oldFiber: Fiber): Map<string | number, Fiber> {
        const existingChildren: Map<string | number, Fiber> = new Map();
        let existingChild: Fiber | null = oldFiber;
        while (existingChild !== null) {
            if (existingChild.key !== null) {
                existingChildren.set(existingChild.key, existingChild);
            } else {
                existingChildren.set(existingChild.index, existingChild);
            }
            existingChild = existingChild.sibling;
        }
        return existingChildren;
    }

    function updateFromMap(
        existingChildren: Map<string | number, Fiber>,
        returnFiber: Fiber,
        newIdx: number,
        newChild: any
    ) {
        if (isText(newChild)) {
            // 文本节点
            const matchedFiber = existingChildren.get(newIdx) || null;
            return updateTextNode(returnFiber, matchedFiber, "" + newChild);
        } else if (typeof newChild === "object" && newChild !== null) {
            const matchedFiber = 
            existingChildren.get(newChild.key === null ? newIdx : newChild.key) || 
            null;
            return updateElement(returnFiber, matchedFiber, newChild);
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
        let nextOldFiber = null;
        let lastPlacedIndex = 0;

        let newIdx = 0;

        // old 0 1 2 3 4
        // new 0 1 2 3 稳定

        // new 3 1 2 4 这种情况比较少
        // ! 1. 从左往右遍历 按位置比较 如果可以复用就复用 如果不能复用就退出本轮循环
        for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
            if (oldFiber.index > newIdx) {
                nextOldFiber = oldFiber;
                oldFiber = null; 
            } else {
                nextOldFiber = oldFiber.sibling;
            }
            const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx]);
            if (newFiber === null) {
               if (oldFiber === null) {
                   oldFiber = nextOldFiber;
               }
               break;
            }

            if (shouldTrackSideEffects) {
                if (oldFiber && newFiber?.alternate === null) {
                    // 新增
                    deleteChild(returnFiber, oldFiber);
                }
            }

            // 组件更新节点节点前后位置不一致，需要移动
            lastPlacedIndex = placeChild(newFiber as Fiber, lastPlacedIndex, newIdx);

            if (previousNewFiber === null) {
                resultingFirstChild = newFiber as Fiber;
            } else {
                previousNewFiber.sibling = newFiber as Fiber;
            }
            previousNewFiber = newFiber as Fiber;

            oldFiber = nextOldFiber;
        }

        // * vue 因为vue采用的是数组 从右往左遍历一轮 如果找到就复用 如果没有就退出本轮循环

        // ! 2.1 如果新节点没了， 但是老节点还有，删除老节点
        if (newIdx === newChildren.length) {
            deleteRemainingChildren(returnFiber, oldFiber as Fiber);
            return resultingFirstChild;
        }
        //! 2.2 如果老节点没了， 但是新节点还有，添加新节点
        // 初次渲染
        if (oldFiber === null) {
            // 链表
            for (; newIdx < newChildren.length; newIdx++) {
                const newFiber = createChild(returnFiber, newChildren[newIdx]);
                if (newFiber === null) {
                    continue;
                }

                // newFiber.index = newIdx;
                lastPlacedIndex = placeChild(newFiber as Fiber, lastPlacedIndex, newIdx);
                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber;
                } else {
                    previousNewFiber.sibling = newFiber;
                }
                previousNewFiber = newFiber;

            }
            return resultingFirstChild;
        }
        //! 2.3 新老节点都有，
        const existingChildren = mapRemainingChildren(oldFiber as Fiber);
        for (; newIdx < newChildren.length; newIdx++) {
            const newFiber = updateFromMap(
                existingChildren,
                returnFiber,
                newIdx, 
                newChildren[newIdx]
            )

            if (newFiber !== null) {
               if (shouldTrackSideEffects) {
                  existingChildren.delete(newFiber.key === null ? newIdx : newFiber.key); 
               } 
               // 放置fiber
               lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
               if (previousNewFiber === null) {
                   resultingFirstChild = newFiber; 
               } else {
                    previousNewFiber.sibling = newFiber;
               }
                previousNewFiber = newFiber;
            }
        }

        // ! 2.4 删除多余的节点
        if ( shouldTrackSideEffects ) {
            existingChildren.forEach((child) => deleteChild(returnFiber, child));
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