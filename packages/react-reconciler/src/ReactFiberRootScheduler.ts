import { performConcurrentWorkOnRoot } from "./ReactFiberWorkLoop";
import type { FiberRoot } from "./ReactInternalTypes";
import { NormalPriority } from "scheduler/src/SchedulerPriorities";
import { Scheduler } from "scheduler";

export function ensureRootIsScheluded(root: FiberRoot) {
    // 启动一个微任务来处理这个root 微任务用于那些需要尽快执行的异步操作
    queueMicrotask(() => {
        scheduleTaskForRootDuringMicrotask(root);
    })
}


export function scheduleTaskForRootDuringMicrotask(root: FiberRoot) {
    const schedulerPriorityLevel = NormalPriority;
    // 创建一个任务放到调度器中
    Scheduler.scheduleCallback(
        schedulerPriorityLevel,
        performConcurrentWorkOnRoot.bind(null, root)
    )
}