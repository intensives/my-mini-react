// !实现一个单线程调度器
// todo 二周目再写延迟的任务
import { getCurrentTime } from 'shared/utils';
import {
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    IdlePriority,
    LowPriority,
    PriorityLevel,
    NoPriority
} from './SchedulerPriorities';
import { peek, pop, push } from './SchedulerMinHeap';
import { lowPriorityTimeout, maxSigned31BitInt, normalPriorityTimeout, userBlockingPriorityTimeout } from './SchedulerFeatureFlags';

type Callback = ((arg: boolean) => Callback | null | undefined) | null;
// type Callback = (arg: boolean) => Callback | null | undefined
export type Task = {
    id: number;
    callback: Callback;
    priorityLevel: PriorityLevel;
    startTime: number;
    expirationTime: number;
    sortIndex: number;
}

const taskQueue: Array<Task> = []; // 任务池 最小堆
let currentPriorityLLevel: PriorityLevel = NoPriority; // 当前正在执⾏任务的优先级
let currentTask: Task | null = null; // 当前正在执⾏的任务

// 开始时间 时间戳
let startTime: number = -1;

// 时间片
let frameInterval: number = 5;

// 任务id
let taskIdCounter: number = 1; 

// 主线程是否在调度
let isHostCallbackScheduled: boolean = false; 

// 锁
// 是否有 work 在执行
let isPerformingWork: boolean = false; 

// 交换控制权   交给主线程
function shouldYieldToHost() {
    // todo
    const timeElapsed = getCurrentTime() - startTime;
    return timeElapsed >= frameInterval;
}

// 任务调度器 任务进入调度器，等待调度
// 执行流程：添加任务 -> requestHostCallback()(通过消息通道来实现) ->
//schedulePerformWorkUntilDeadline(发送消息) -> performWorkUntilDeadline()(接收消息的回调函数) -> 
// flushWork() -> workLoop() -> callback() ->
// schedulePerformWorkUntilDeadline()(还有时间片继续执行任务)
function scheduleCallback(priorityLevel: PriorityLevel, callback: Callback) {
    // todo
    let startTime = getCurrentTime();
    // 任务超时时间
    let timeout: number = 0;
    switch (priorityLevel) {
        case ImmediatePriority:
            timeout = -1;
            break;
        case UserBlockingPriority:
            timeout = userBlockingPriorityTimeout;
            break;
        case LowPriority:
            timeout = lowPriorityTimeout;
            break;
        case IdlePriority:
            timeout = maxSigned31BitInt;
            break;
        case NormalPriority:
        default:
            timeout = normalPriorityTimeout;
            break;
    }

    let expirationTime = startTime + timeout;
    const newTask: Task = {
        id: taskIdCounter++,
        callback,
        priorityLevel,
        startTime,
        expirationTime,
        sortIndex: -1,
    }
    // 由startTime和priorityLevel计算出sortIndex
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);
    // 是否正在执行任务 不是单线程吗？如果执行到这应该就是false了
    if (!isPerformingWork && !isHostCallbackScheduled) {
        isHostCallbackScheduled = true;
        // 开始执行任务
        requestHostCallback();
    }
}
// 
let isMessageLoopRunning: boolean = false; // 消息通道是否正在运行
function requestHostCallback() {
    if (!isMessageLoopRunning) {
        isMessageLoopRunning = true;
        schedulePerformWorkUntilDeadline();
    }

}

function performWorkUntilDeadline() {
    if (isMessageLoopRunning) {
        // 起始时间 时间戳
        const currentTime = getCurrentTime();
        startTime = currentTime;
        let hasMoreWork: boolean|undefined = true;
        try {
            hasMoreWork = flushWork(currentTime);
        } finally {
            if (hasMoreWork) {
                schedulePerformWorkUntilDeadline();
            } else {
                isMessageLoopRunning = false;
            }
        }
    }
}

// 异步任务 通过消息通道来实现
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;
function schedulePerformWorkUntilDeadline() {
    port.postMessage(null);
}

function flushWork(initialTime: number) {
    // todo
    isHostCallbackScheduled = false;
    isPerformingWork = true;
    const previousPriorityLevel = currentPriorityLLevel;
    try {
        return workLoop(initialTime);
    } finally {
        currentTask = null;
        currentPriorityLLevel = previousPriorityLevel;
        isPerformingWork = false;
    }
}
// 通过设置元素的回调函数为null取消任务
function cancelCallback() {
    currentTask!.callback = null;
}

function getCurrentPriorityLevel() {
    return currentPriorityLLevel;
}

// 每一个workLoop都是一个时间片, 存在很多任务， 执行callback
// 返回true表示还有任务没有执行完, false表示没有任务需要执行
function workLoop(initialTimer: number) {
    let currentTime = initialTimer;
    currentTask = peek(taskQueue);
    while (currentTask !== null) {
        // 执行任务
        // !是否到了交换控制权的时候 如果时间没得就不执行
        if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
            break;
        }
        // 里面逻辑不知道怎么处理的
        const callback = currentTask.callback;
        if (typeof callback === 'function') {
            currentTask.callback = null;
            currentPriorityLLevel = currentTask.priorityLevel;
            // !根据didUserCallbackTimeout的值判断是否需要继续执行任务
            const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
            const continuationCallback = callback(didUserCallbackTimeout);
            currentTime = getCurrentTime(); 
            if (typeof continuationCallback === 'function') {
                currentTask.callback = continuationCallback;
                return true;
            } else {
                if (currentTask === peek(taskQueue)) {
                    pop(taskQueue);
                }
            }
        } else {
            pop(taskQueue);
        }
        currentTask = peek(taskQueue);
    }

    if (currentTask !== null) {
        return false;
    } else {
        return true;
    }
}

export {
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    IdlePriority,
    LowPriority,
    scheduleCallback, // 某个任务进入调度器，等待调度
    cancelCallback, // 取消某个任务，由于最⼩堆没法直接删除，因此只能初步把 task.
    getCurrentPriorityLevel, // 获取当前正在执⾏任务的优先级
    shouldYieldToHost as shouldYield, // 把控制权交换给主线程
};