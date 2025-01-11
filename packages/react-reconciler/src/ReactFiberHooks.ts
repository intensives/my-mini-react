import { isFn } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";

type Hook = {
    memoizedState: any;
    next: Hook | null;
}

let currentlyRenderingFiber: Fiber | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

export function renderWithHooks(
    current: Fiber | null,
    workInProgress: Fiber,
    Component: any,
    props: any
) {
    currentlyRenderingFiber = workInProgress;
    workInProgress.memoizedState = null;

    const children = Component(props);
    // 置为空 开头不需要本来就是空
    finishRenderingHooks();
    return children;
}

export function finishRenderingHooks() {
    currentlyRenderingFiber = null;
    workInProgressHook = null;
    currentHook = null;
}
// S函数 I初始值 A init函数
export function useReducer<S, I, A>(
    reducer: (state: S, action: A) => S,
    initialArg: I,
    init?: (initialArg: I) => S
) {
    // ! 1构建hooks链表
    const hook: Hook = {
        memoizedState: null,
        next: null
    };
    let initialState: S;
    if (init !== undefined && isFn(init)) {
        initialState = init(initialArg);
    } else {
        initialState = initialArg as any;
    }
    // ! 2. 判断是否是第一次渲染
    hook.memoizedState = initialState;
    // ! 3. 调度更新 dispatch
    const dispatch = (action: A) => {
        const newValue = reducer(initialState, action);
    };
    hook.memoizedState = initialState;
    return [hook.memoizedState, dispatch];
}