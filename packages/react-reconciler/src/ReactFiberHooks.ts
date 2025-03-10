import { isFn } from "shared/utils";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { HostRoot } from "./ReactWorkTags";
import { Flags, Passive, Update } from "./ReactFiberFlags";
import { HookFlags, HookLayout, HookPassive } from "./ReactHookEffectTags";
import { ReactContext } from "shared/ReactTypes";
import { readContext } from "./ReactFiberNewContext";

type Hook = {
    memoizedState: any;
    next: Hook | null;
}

type Effect = {
    tag: HookFlags;
    create: () => (() => void) | void;
    deps: Array<any> | null | void;
    next: Effect | null;
}

// 当前正在工作的函数组件的fiber
let currentlyRenderingFiber: Fiber | null = null;
// 新hook
let workInProgressHook: Hook | null = null;
// 老hook
let currentHook: Hook | null = null;

export function renderWithHooks<Props>(
    current: Fiber | null,
    workInProgress: Fiber,
    Component: any,
    props: Props,
): any {
    currentlyRenderingFiber = workInProgress;
    workInProgress.memoizedState = null;
    workInProgress.updateQueue = null;

    // 执行函数组件
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
    // currentlyRenderingFiber不是置为空了吗？在执行过程中
    const current = currentlyRenderingFiber?.alternate;
    if (current) {
        // update 阶段
        currentlyRenderingFiber!.memoizedState = current.memoizedState;
        if (workInProgressHook != null) {
            // 不是第一个hook
            workInProgressHook = hook = workInProgressHook.next!;
            currentHook = currentHook!.next as Hook;
        } else {
            // 第一个hook 头节点
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
            // hook单链表的头节点
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

// useEffect和useLayoutEffect的区别
// sy effect和layoutEffect的区别是执行的时机不同, useLayoutEffect会阻塞浏览器渲染，useEffect不会
export function useLayoutEffect(
    create: () => (() => void) | void,
    deps: Array<any> | void | null
) {
    return updateEffectImpl(Update, HookLayout, create, deps);
}


export function useEffect(
    create: () => (() => void) | void,
    deps: Array<any> | void | null
) {
    return updateEffectImpl(Passive, HookPassive, create, deps);
}

function updateEffectImpl(
    fiberFlags: Flags,
    hookFlags: HookFlags,
    create: () => (() => void) | void,
    deps: Array<any> | void | null
){
    const hook = updateWorkInProgressHook();

    const nextDeps = deps === undefined ? null : deps;

    if (currentHook !== null) {
        if (nextDeps!== null) {
            const prevDeps = currentHook.memoizedState.deps;
            if (areHookInputsEqual(nextDeps, prevDeps)) {
                // 依赖没有变化
                return; 
            }
        }
    }
    currentlyRenderingFiber!.flags |= fiberFlags;

    // * 存放effect， updatequeue构建effect链表
    hook.memoizedState = pushEffect(hookFlags, create, nextDeps);
}

function pushEffect(
    hookFlags: HookFlags,
    create: () => (() => void) | void,
    deps: Array<any> | void | null
) {
    const effect: Effect = {
        tag: hookFlags,
        create,
        deps,
        next: null
    };

    let componentUpdateQueue = currentlyRenderingFiber!.updateQueue;
    // 单向循环链表
    if (componentUpdateQueue === null) {
        componentUpdateQueue = {
            lastEffect: null,
        };
        currentlyRenderingFiber!.updateQueue = componentUpdateQueue;
        componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
        const lastEffect = componentUpdateQueue.lastEffect;
        const firstEffect = lastEffect.next;
        lastEffect.next = effect;
        effect.next = firstEffect;
        componentUpdateQueue.lastEffect = effect;
    }

    return effect;
}

// 不同文件使用context需要导入
export function useContext<T>(context: ReactContext<T>): T {
    // todo
    // 带_的值不是不能访问吗？？？
    return readContext(context);
}