import type { Fiber, FiberRoot } from './ReactInternalTypes';
import { ensureRootIsScheluded } from './ReactFiberRootScheduler';
import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
import { commitMutationEffects, flushPassiveEffects } from './ReactFiberCommitWork';
import { NormalPriority } from 'scheduler/src/SchedulerPriorities';
import { Scheduler } from "scheduler";

type ExecutionContext = number;
export const NoContext = /*      */ 0b000;

const BatchedContext = /*        */ 0b001;
export const RenderContext = /*  */ 0b010;
export const CommitContext = /*  */ 0b100;
// Describes where we are in the React execution stack
let executionContext: ExecutionContext = NoContext;

let workInProgress: Fiber | null = null;
let workInProgressRoot: FiberRoot | null = null;
export function scheduleUpdateOnFiber(
    root: FiberRoot, 
    fiber: Fiber, 
    isSync?: boolean
) {
    workInProgressRoot = root;
    workInProgress = fiber;

    if (isSync) {
        queueMicrotask(() => {
            performConcurrentWorkOnRoot(root);
        });
    } else {
        ensureRootIsScheluded(root)
    };
}
// 任务执行更新入口
export function performConcurrentWorkOnRoot(root: FiberRoot) {
    // !1. render, 构建fiber树 VDOM (beginWork|completeWork)

    renderRootSync(root);


    const finishedWork: Fiber = root.current.alternate as Fiber;
    root.finishedWork = finishedWork;
    // !3 commit VDOM ->DOM
    // root
    commitRoot(root);
}
function renderRootSync(root: FiberRoot) {
    const prevExecutionContext = executionContext;
    // !1. render阶段开始
    executionContext |= RenderContext;

    // !2.初始化
    prepareFreshStack(root);

    // !3.遍历构建fiber树
    workLoopSync();

    // !4.构建完毕 render结束
    executionContext = prevExecutionContext;

    // !5. 重置
    workInProgressRoot = null;

    // 设置为null，表示没有进行的render
}

function commitRoot(root: FiberRoot) {
    // !1. commit阶段开始
    const prevExecutionContext = executionContext;
    executionContext |= CommitContext;

    const finishedWork = root.finishedWork as Fiber;

    // ! mutation
    commitMutationEffects(root, finishedWork);

    // !2.1 passive effect阶段 执行passive effect
    Scheduler.scheduleCallback(NormalPriority, () => {
        flushPassiveEffects(root.finishedWork as Fiber);
    });
    //!2. commit阶段结束
    executionContext = prevExecutionContext;
    return null;
}

/**
 * 准备新的Fiber树栈
 * @param root - 根Fiber节点
 * @returns 返回新创建的workInProgress Fiber节点
 */
function prepareFreshStack(root: FiberRoot): Fiber {
    root.finishedWork = null;

    workInProgressRoot = root; // FiberRoot
    const rootWorkInProgress = createWorkInProgress(root.current, null);
    // 初次渲染
    if (workInProgress === null) {
        workInProgress = rootWorkInProgress; // Fiber
    }

    return rootWorkInProgress;
}

function workLoopSync() {
    while (workInProgress !== null) {
        // workInProgress = performUnitOfWork(workInProgress); 
        performUnitOfWork(workInProgress);
    }

}

function performUnitOfWork(unitOfWork: Fiber): void {
    // 这里unitOfWork是待构建的fiber， 所以alternate是上一次构建的fiber
    const current = unitOfWork.alternate;

    const next = beginWork(current, unitOfWork);
    // !把pendingProp更新到memoizedProp 子节点在创建fiber时已经把pendingProps属性赋值了
    unitOfWork.memoizedProps = unitOfWork.pendingProps;
    // 构建一条支路的fiber树
    if (next === null) {
        // !当前没有下一个节点，找叔叔节点 切换支路
        completeUnitOfWork(unitOfWork);
    } else {
        // !有下一个节点 
        workInProgress = next;
    }
    // return next;
}
// 深度优先遍历，找到兄弟、父节点的兄弟节点、祖先的兄弟节点
function completeUnitOfWork(unitOfWork: Fiber) {
    let completedWork: Fiber | null = unitOfWork;
    do {

        const current = completedWork.alternate;
        const returnFiber = completedWork.return;

        let next = completeWork(current, completedWork);
        // !是否有子节点
        if (next !== null) {
            // !有子节点
            workInProgress = next;
            return;
        }

        // !是否有兄弟节点
        const siblingFiber = completedWork.sibling;
        if (siblingFiber !== null) {
            // !有兄弟节点
            workInProgress = siblingFiber;
            return;
        }

        // !没有兄弟节点，找叔叔节点 返回上一层
        completedWork = returnFiber as Fiber;
        workInProgress = completedWork;
    } while (completedWork !== null);

}


