import { isFn } from "shared/utils";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { HostRoot } from "./ReactWorkTags";

type Hook = {
    memoizedState: any;
    next: Hook | null;
}

// 当前正在工作的函数组件的fiber
let currentlyRenderingFiber: Fiber | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

export function renderWithHooks<Props>(
    current: Fiber | null,
    workInProgress: Fiber,
    Component: any,
    props: Props,
): any {
    currentlyRenderingFiber = workInProgress;
    workInProgress.memoizedState = null;

    let children = Component(props);
    // 置为空 开头不需要本来就是空
    finishRenderingHooks();
    return children;
}

export function finishRenderingHooks() {
    currentlyRenderingFiber = null;
    workInProgressHook = null;
    currentHook = null;
}

// 1. 返回当前useX函数对应的hook
// 2. 构建hook链表
function updateWorkInProgressHook(): Hook {
    let hook: Hook;
    // currentlyRenderingFiber不是置为空了吗？
    const current = currentlyRenderingFiber?.alternate;
    if (current) {
        // update 阶段
        currentlyRenderingFiber!.memoizedState = current.memoizedState;
        if (workInProgressHook != null) {
            // 不是第一个hook
            workInProgressHook = hook = workInProgressHook.next!;
            currentHook = currentHook!.next as Hook;
        } else {
            // 第一个hook
            workInProgressHook = hook = currentlyRenderingFiber!.memoizedState;
            currentHook = current.memoizedState;
        }
    } else {
        // mount 阶段
        currentHook = null;
        hook = {
            memoizedState: null,
            next: null
        };

        // 保证了要么是第一个hook，要么是链表的最后一个hook
        if (workInProgressHook) {
            // 第一个hook
            workInProgressHook = workInProgressHook.next = hook;
        } else {
            // 链表
            workInProgressHook = currentlyRenderingFiber!.memoizedState = hook;
        }

    }
    return hook;
}
// S函数 I初始值 A init函数
export function useReducer<S, I, A>(
    reducer: ((state: S, action: A) => S) | null,
    initialArg: I,
    init?: (initialArg: I) => S
) {
    // ! 1构建hooks链表
    const hook: Hook = updateWorkInProgressHook();
    let initialState: S;
    // if (init !== undefined && isFn(init)) {
    if (init !== undefined) {
        initialState = init(initialArg);
    } else {
        initialState = initialArg as any;
    }
    // ! 2. 判断是否是第一次渲染
    if (!currentlyRenderingFiber?.alternate) {
        hook.memoizedState = initialState;
    }
    // ! 3. 调度更新 dispatch
    // 柯里化 这样也可以
    const dispatch = dispatchReducerAction.bind(
        null,
        currentlyRenderingFiber!,
        hook,
        reducer as any
    );
    return [hook.memoizedState, dispatch];
}

function dispatchReducerAction<S, I, A>(
    fiber: Fiber,
    hook: Hook,
    reducer: ((state: S, action: A) => S) | null,
    action: any
) {
    // 通用 考虑useState函数和useReducer函数
    hook.memoizedState = reducer ? reducer(hook.memoizedState, action) : action;

    const root = gerRootForUpdateFiber(fiber);

    fiber.alternate = { ...fiber };
    if (fiber.sibling) {
        fiber.sibling.alternate = fiber.sibling
    }
    // 调度更新
    scheduleUpdateOnFiber(root, fiber, true);
}

function gerRootForUpdateFiber(sourceFiber: Fiber): FiberRoot {
    let node = sourceFiber;
    let parent = node.return;
    while (parent !== null) {
        node = parent;
        parent = node.return;
    }
    return node.tag === HostRoot ? node.stateNode : null;
}

export function useState<S>(initialState: (() => S) | S) {
    const init = isFn(initialState) ? (initialState as any) : initialState;
    return useReducer(null, init);
}

export function useMemo<T>(
    nextCreate: () => T,
    deps: Array<any> | null | void
): T {
    // todo
    const hook = updateWorkInProgressHook();

    const nextDeps = deps === undefined ? null : deps;
    const prevState = hook.memoizedState;

    if (prevState !== null) {
        if (nextDeps !== null) {
            // 依赖必是个数组
            const prevDeps = prevState[1];
            if (areHookInputsEqual(nextDeps, prevDeps)) {
                // 依赖没有变化
                return prevState[0];
            }
        }
    }

    const nextValue = nextCreate();
    hook.memoizedState = [nextValue, nextDeps];
    return nextValue;
}

export function areHookInputsEqual(
    nextDeps: Array<any>,
    prevDeps: Array<any> | null
): boolean {
    if (prevDeps === null) {
        return false;
    }

    for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        if (Object.is(nextDeps[i], prevDeps[i])) {
            continue;
        }
        return false;
    }
    return true;
}

// 缓存函数
export function useCallback<T>(
    callback: T,
    deps: Array<any> | null | void
): T {
    // todo
    const hook = updateWorkInProgressHook();

    const nextDeps = deps === undefined ? null : deps;
    const prevState = hook.memoizedState;

    if (prevState !== null) {
        if (nextDeps !== null) {
            // 依赖必是个数组
            const prevDeps = prevState[1];
            if (areHookInputsEqual(nextDeps, prevDeps)) {
                // 依赖没有变化
                return prevState[0];
            }
        }
    }

    hook.memoizedState = [callback, nextDeps];
    return callback;
}

// 实现useRef
export function useRef<T>(initialValue: T) {
    const hook = updateWorkInProgressHook();
    if (currentHook === null) {
        hook.memoizedState = { current: initialValue };
    }
    return hook.memoizedState;
}