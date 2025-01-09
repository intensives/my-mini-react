import { isNum, isStr } from 'shared/utils';
import type { Fiber } from './ReactInternalTypes';
import { HostComponent, HostRoot } from './ReactWorkTags';
import { reconcileChildFibers, mountChildFibers } from './ReactChildFiber';
// !1.处理当前fiber, 不同组件类型对应不同的处理逻辑
// !2. 返回子节点的child
export function beginWork(
    current: Fiber | null,
    workInProgress: Fiber,
): Fiber | null {
    // todo 区分组件类型 目前只添加了根组件和原生标签
    switch (workInProgress.tag) {
        case HostRoot:
            return updateHostRoot(current, workInProgress);
        case HostComponent:
            return updateHostComponent(current, workInProgress);
    }
    throw new Error(
        `Unknown unit of work tag (${workInProgress.tag}). This error is l
        "React. Please file an issue."`
    );
}

// 出来根组件
function updateHostRoot(current: Fiber | null, workInProgress: Fiber) {
    const nextChildren = workInProgress.memoizedState.element;
    // 协调子节点
    reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;
}
// 处理原生标签 div span p等
function updateHostComponent(current: Fiber | null, workInProgress: Fiber) {
    const { type, pendingProps } = workInProgress;
    let nextChildren = workInProgress.pendingProps.children;
    const isDirectTextChild = shouldSetTextContent(type, pendingProps);

    if (isDirectTextChild) {
        // 文本属性
        nextChildren = null;
        return null;
    }

    reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;
}
// 协调子节点 构建新的fiber树
function reconcileChildren(
    current: Fiber | null,
    workInProgress: Fiber,
    nextChildren: any,
) {

    console.log('%c [  ]-50', 'font-size:13px; background:pink; color:#bf2c9f;', current)
    if (current === null) {
        // 初次渲染 无还在节点
        workInProgress.child = mountChildFibers(
            workInProgress,
            null, 
            nextChildren
        );
    } else {
        // 更新 有child
        workInProgress.child = reconcileChildFibers(
            workInProgress, 
            current.child, 
            nextChildren
        );
    }
}

function shouldSetTextContent(type: string, props: any): boolean {
    return (
        type === "textarea" ||
        type === "noscript" ||
        isStr(props.children) ||
        isNum(props.children) ||
        (typeof props.dangerouslySetInnerHTML === "object" &&
            props.dangerouslySetInnerHTML !== null &&
            props.dangerouslySetInnerHTML.__html != null
        )
    )
}