import { isNum, isStr } from 'shared/utils';
import type { Fiber } from './ReactInternalTypes';
import { ClassComponent, ContextProvider, Fragment, FunctionComponent, HostComponent, HostRoot, HostText } from './ReactWorkTags';
import { popProvider } from './ReactFiberNewContext';
export function completeWork(
    current: Fiber | null,
    workInProgress: Fiber
): Fiber | null {
    const newProps = workInProgress.pendingProps;
    switch (workInProgress.tag) {
        case Fragment:
        case ClassComponent:
        case FunctionComponent:
        case HostRoot: {
            return null;
        }
        case ContextProvider: {
            // 恢复context的默认值
            popProvider(workInProgress.type._context);
            return null;
        }
        // 并没有将其挂载到dom上，而是在stateNode上挂载了子节点
        case HostComponent: {
            // type 是标签名
            const { type } = workInProgress;
            if (current !== null && workInProgress.stateNode !== null) {
                // 更新阶段
                updateHostComponent(current, workInProgress, type, newProps);
            } else {
                // 1. 创建真实dom节点
                const instance = document.createElement(type);
                // 2. 初始化dom属性
                finalizeInitialChildren(instance, null, newProps);
                // 3. 把子dom挂载到父dom上
                appendAllChildren(instance, workInProgress);
                workInProgress.stateNode = instance;
            }
            return null;
        }
        case HostText: {
            workInProgress.stateNode = document.createTextNode(newProps);
            return null;
        }
            throw new Error(
                `Unknown unit of work tag (${workInProgress.tag}). This error is l ` +
                "React. Please file an issue."
            );
    }
    return null;
}

function updateHostComponent(
    current: Fiber,
    workInProgress: Fiber,
    type: string,
    newProps: any
) {
    if (current.memoizedProps === newProps) {
        return; // 只有一个
    }
    finalizeInitialChildren(
        workInProgress.stateNode as Element,
        current.memoizedProps,
        newProps
    );
}

function finalizeInitialChildren(
    domElement: Element,
    prevProps: any,
    nextProps: any
) {
    // 真tm寒掺
    for (const propKey in prevProps) {
        const prevProp = prevProps[propKey];
        if (propKey === 'children') {
            if (isStr(prevProp) || isNum(prevProp)) {
                // 文本节点 置不置空无所谓
                domElement.textContent = "";
            }
        } else {
            // 设置事件
            if (propKey === 'onClick') {
                domElement.removeEventListener('click', prevProp);
            } else {
                if (!(prevProp in nextProps)) {
                    // 设置属性
                    (domElement as any)[propKey] = "";
                }
            }
        }
    }


    for (const propKey in nextProps) {
        const nextProp = nextProps[propKey];
        if (propKey === 'children') {
            if (isStr(nextProp) || isNum(nextProp)) {
                // 文本节点
                domElement.textContent = nextProp + "";
            }
        } else {
            // 设置事件
            if (propKey === 'onClick') {
                domElement.addEventListener('click', nextProp);
            } else {
                // 设置属性
                (domElement as any)[propKey] = nextProp;
            }
        }
    }
}

// 初始化属性

// function finalizeInitialChildren(
//     domElement: Element,
//     prevProps: any,
//     nextProps: any
// ) {
//     for (const propKey in prevProps) {
//         const prevProp = prevProps[propKey];
//         if (propKey === "children") {
//             if (isStr(prevProp) || isNum(prevProp)) {
//                 // 属性
//                 domElement.textContent = "";
//             }
//         } else {
//             // 3. 设置属性
//             if (propKey === "onClick") {
//                 domElement.removeEventListener("click", prevProp);
//             } else {
//                 if (!(prevProp in nextProps)) {
//                     (domElement as any)[propKey] = "";
//                 }
//             }
//         }
//     }
//     for (const propKey in nextProps) {
//         const nextProp = nextProps[propKey];
//         if (propKey === "children") {
//             if (isStr(nextProp) || isNum(nextProp)) {
//                 // 属性
//                 domElement.textContent = nextProp + "";
//             }
//         } else {
//             // 3. 设置属性
//             if (propKey === "onClick") {
//                 domElement.addEventListener("click", nextProp);
//             } else {
//                 (domElement as any)[propKey] = nextProp;
//             }
//         }
//     }
// }

function appendAllChildren(parent: Element, workInProgress: Fiber) {
    let nodeFiber = workInProgress.child; // 链表结构
    while (nodeFiber !== null) {
        // 正常节点
        if (isHost(nodeFiber)) {
            parent.appendChild(nodeFiber.stateNode);
        } else if (nodeFiber.child !== null) {
            nodeFiber = nodeFiber.child;
            continue;
        }

        // 如果往上找到当前节点
        if (nodeFiber === workInProgress) {
            return;
        }

        while (nodeFiber.sibling === null) {
            if (nodeFiber.return === null || nodeFiber.return === workInProgress) {
                return;
            }
            nodeFiber = nodeFiber.return; // f**k 
        }
        nodeFiber = nodeFiber.sibling;
    }
}


// fiber是dom节点 不是fragment
export function isHost(fiber: Fiber): boolean {
    return fiber.tag === HostComponent || fiber.tag === HostText;
}