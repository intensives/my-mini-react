import type { WorkTag } from "./ReactWorkTags";
import type { Flags } from "./ReactFiberFlags";

export type Fiber = {
    // 标记fiber的类型，即描述的组件类型，如原⽣标签、函数组件、类组件、Fragment等
    tag: WorkTag;
    // 标记组件在当前层级下的的唯⼀性
    key: null | string;
    // 组件类型
    elementType: any;
    // 标记组件类型，如果是原⽣组件，这⾥是字符串，如果是函数组件，这⾥是函数，如果是
    type: any;
    // 如果组件是原⽣标签，DOM；如果是类组件，是实例；如果是函数组件，是null
    // 如果组件是原⽣根节点，stateNode存的是FiberRoot. HostRoot=3
    stateNode: any;
    // ⽗fiber
    return: Fiber | null;
    // 单链表结构
    // 第⼀个⼦fiber
    child: Fiber | null;
    // 下⼀个兄弟fiber
    sibling: Fiber | null;
    // 记录了节点在当前层级中的位置下标，⽤于diff时候判断节点是否需要发⽣移动
    index: number;
    // 新的props
    pendingProps: any;
    // 上⼀次渲染时使⽤的 props
    memoizedProps: any;
    // 不同的组件的 memoizedState 存储不同
    // 函数组件 hook0
    // 类组件 state
    // HostRoot RootState
    memoizedState: any;
    // Effect diff算法的标记
    flags: Flags;
    // 缓存fiber
    alternate: Fiber | null;

    // 记录需要删除的节点数组
    deletions: Array<Fiber> | null;
};

export type Container = Element | Document | DocumentFragment;

// 比fiber节点多了一个containerInfo属性，存储了容器节点
export type FiberRoot = {
    containerInfo: Container;
    current: Fiber;
    // 一个准备提交work in progress的fiber
    finishedWork: Fiber | null;
}