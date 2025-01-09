import { ReactElement } from "shared/ReactTypes";
import { NoFlags } from "./ReactFiberFlags";
import type { Fiber } from './ReactInternalTypes'
import { isFn, isStr } from 'shared/utils';
import { ClassComponent, Fragment, FunctionComponent, HostComponent, HostText } from "./ReactWorkTags";
import { IndeterminateComponent, WorkTag } from "./ReactWorkTags";
import { REACT_FRAGMENT_TYPE } from "shared/ReactSymbols";

// 创建一个fiber节点
export function createFiber(
    tag: WorkTag,
    pendingProps: any,
    key: null | string,
): Fiber {
    // return new (FiberNode as any)(tag, pendingProps, key);
    return new FiberNode(tag, pendingProps, key);
}

// 不这样写参数类型太多不整洁 用类的方式创建fiber节点
function FiberNode(tag: WorkTag, pendingProps: any, key: null | string) {
    // function FiberNode(this: Fiber, tag: WorkTag, pendingProps: any, key: null | string) {
    // 实例化一个fiber节点
    // 标记类型
    this.tag = tag;
    // 定义key
    this.key = key;
    // 组件类型
    this.elementType = null;
    this.type = null;
    // 不同的组件的stateNode存储不同
    // 原生标签 string'
    // 类组件实例
    this.stateNode = null;
    // Fiber
    this.return = null;
    this.child = null;
    this.sibling = null;
    // 记录节点在兄弟节点中哦的位置下标，用于diff时候判断节点是否需要发生移动
    this.index = 0;

    this.pendingProps = pendingProps;
    this.memoizedProps = null;

    // 不同的组件的memoizedState存储不同
    // 函数组件hook0
    // 类组件state
    this.memoizedState = null;

    // effect
    this.flags = NoFlags;


    // 缓存fiber
    this.alternate = null;
}

// 根据ReactElement创建fiberFrom节点
export function createFiberFromElement(
    element: ReactElement
): Fiber {
    const { type, key } = element;
    const pendingProps = element.props;
    const fiber = createFiberFromTypeAndProps(type, key, pendingProps);
    return fiber;
}

// 根据TypeAndProps创建fiber节点
export function createFiberFromTypeAndProps(
    type: any,
    key: null | string,
    pendingProps: any
) {
    let fiberTag: WorkTag = IndeterminateComponent;
    if (isFn(type)) {
        // 函数组件和类组件
        if (type.prototype.isReactComponent) {
            fiberTag = ClassComponent;
        } else {
            fiberTag = FunctionComponent;
        }
    } else if (isStr(type)) {
        // 原生标签
        fiberTag = HostComponent;
    } else if (type === REACT_FRAGMENT_TYPE) {
        fiberTag = Fragment
    }
    const fiber = createFiber(fiberTag, pendingProps, key);
    fiber.elementType = type;
    fiber.type = type;
    return fiber;
}

/**
 * 创建一个workInProgress Fiber节点，用于更新过程中的新树构建, 把current属性赋值给alternate。
 * @param current - 当前的Fiber节点，已经构建好的fiber。
 * @param pendingProps - 新的props，将应用于workInProgress节点。
 * @returns 返回新创建的workInProgress Fiber节点。
 */
export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
    let workInProgress = current.alternate;
    if (workInProgress === null) {
        workInProgress = createFiber(current.tag, pendingProps, current.key);
        workInProgress.elementType = current.elementType;
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;

        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        workInProgress.pendingProps = pendingProps;
        workInProgress.type = current.type;
        workInProgress.flags = NoFlags;
    }

    workInProgress.flags = current.flags;
    // workInProgress.childLanes = current.childLanes;
    // workInProgress.lanes = current.lanes;

    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    // workInProgress.updateQueue = current.updateQueue;

    workInProgress.sibling = current.sibling;
    workInProgress.index = current.index;

    return workInProgress;
}

export function createFiberFromText(content: string): Fiber {
    const fiber = createFiber(HostText, content, null);
    return fiber;
}