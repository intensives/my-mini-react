import { isNum, isStr } from 'shared/utils';
import type { Fiber } from './ReactInternalTypes';
import { ClassComponent, Fragment, FunctionComponent, HostComponent, HostRoot, HostText } from './ReactWorkTags';
import { reconcileChildFibers, mountChildFibers } from './ReactChildFiber';
import { renderWithHooks } from './ReactFiberHooks';
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
        case HostText:
            return updateHostText(current, workInProgress);
        case Fragment:
            return updateHostFragment(current, workInProgress);
        case ClassComponent:
            return updateClassComponent(current, workInProgress);
        case FunctionComponent:
            return updateFunctionComponent(current, workInProgress);
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

function updateHostText(current: Fiber | null, workInProgress: Fiber) {
    return null;
}

function updateHostFragment(current: Fiber | null, workInProgress: Fiber) {
    const nextChildren = workInProgress.pendingProps.children;
    reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;
}

function updateClassComponent(current: Fiber | null, workInProgress: Fiber) {
    const { type, pendingProps } = workInProgress;
    // 构造一个类对象
    const instance = new type(pendingProps);
    // workInProgress.stateNode = instance;

    const children = instance.render();

    reconcileChildren(current, workInProgress, children);
    return workInProgress.child;
}

function updateFunctionComponent(current: Fiber | null, workInProgress: Fiber) {
    const { type, pendingProps } = workInProgress;
    // 构造一个类对象 函数组件转义和直接写标签一样，在标签中的变量值变为textNode
    // const children = new type(pendingProps); 
    //  组件和hooks通信
    const children = renderWithHooks(current, workInProgress, type, pendingProps);
    // workInProgress.stateNode = instance;

    reconcileChildren(current, workInProgress, children);
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
        // 更新 有child fiberRoot节点
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