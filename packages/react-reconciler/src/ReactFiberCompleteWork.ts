import { isNum, isStr } from 'shared/utils';
import type { Fiber } from './ReactInternalTypes';
import { HostComponent, HostRoot } from './ReactWorkTags';
export function completeWork(
    current: Fiber | null,
    workInProgress: Fiber
): Fiber | null {
    switch (workInProgress.tag) {
        case HostRoot: {
            return null;
        }
        case HostComponent: {
            // type 是标签名
            const { type } = workInProgress;
            // 1. 创建真实dom节点
            const instance = document.createElement(type);
            // 2. 初始化dom属性
            finalizwInitialChildren(instance, workInProgress.pendingProps);
            // 3. 把子dom挂载到父dom上
            appendAllChildren(instance, workInProgress);
            workInProgress.stateNode = instance;
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
    let nodeFiber = workInProgress.child;
    if ( nodeFiber ) {
        parent.appendChild(nodeFiber.stateNode);
    }
}