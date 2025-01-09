import { isNum, isStr } from 'shared/utils';
import type { Fiber } from './ReactInternalTypes';
import { Fragment, HostComponent, HostRoot, HostText } from './ReactWorkTags';
export function completeWork(
    current: Fiber | null,
    workInProgress: Fiber
): Fiber | null {
    const newProps = workInProgress.pendingProps;
    switch (workInProgress.tag) {
        case Fragment:
        case HostRoot: {
            return null;
        }
        // 并没有将其挂载到dom上，而是在stateNode上挂载了子节点
        case HostComponent: {
            // type 是标签名
            const { type } = workInProgress;
            // 1. 创建真实dom节点
            const instance = document.createElement(type);
            // 2. 初始化dom属性
            finalizwInitialChildren(instance, newProps);
            // 3. 把子dom挂载到父dom上
            appendAllChildren(instance, workInProgress);
            workInProgress.stateNode = instance;
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

function finalizwInitialChildren(domElement: Element, props: any) {
    for (const propKey in props) {
        const nextProp = props[propKey];
        if (propKey === 'children') {
            if (isStr(nextProp) || isNum(nextProp)) {
                // 文本节点
                domElement.textContent = String(nextProp);
            }
        } else {
            // 设置属性
            (domElement as any)[propKey] = nextProp;
        }
    }
}

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
            return ;
        }

        while (nodeFiber.sibling === null) {
            if (nodeFiber.return === null || nodeFiber.return === workInProgress) {
                return ;
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