import { ReactElement } from "shared/ReactTypes";
import { NoFlags } from "./ReactFiberFlags";
import type { Fiber } from './ReactInternalTypes'
import { isStr } from 'shared/utils';
import { HostComponent } from "./ReactWorkTags";
import { IndeterminateComponent, WorkTag } from "./ReactWorkTags";

// 创建一个fiber节点
export function createFiber(
    tag: WorkTag,
    pendingProps: any,
    key: null | string,
): Fiber {
    return new FiberNode(tag, pendingProps, key);
}

function FiberNode(tag: WorkTag, pendingProps: any, key: null | string) {
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

// 根据ReactElement创建fiber节点
export function createFiberFromElenment (
    element: ReactElement
): Fiber {
    const { type, key } = element;
    const pendingProps = element.props;
    const fiber = createFiberFromTypeAndProps(type, key, pendingProps);
    return fiber; 
}

// 根据TypeAndProps创建fiber节点
export function createFiberFromTypeAndProps (
    type: any,
    key: null | string,
    pendingProps: any
) {
    let fiberTag: WorkTag = IndeterminateComponent;
    if (isStr(type)) {
        // 原生标签
        fiberTag = HostComponent;
    }
    const fiber = createFiber(fiberTag, pendingProps, key);
    fiber.elementType = type;
    fiber.type = type;
    return fiber;
}