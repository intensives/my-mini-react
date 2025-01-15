import { isHost } from "./ReactFiberCompleteWork";
import { ChildDeletion, Passive, Placement, Update } from "./ReactFiberFlags";
import { HookFlags, HookLayout, HookPassive } from "./ReactHookEffectTags";
import { Fiber, FiberRoot } from "./ReactInternalTypes";
import { FunctionComponent, HostComponent, HostRoot, HostText } from "./ReactWorkTags";
// 递归遍历fiber树 前面递归 后面构建fiber树
export function commitMutationEffects(root: FiberRoot, finishedWork: Fiber) {
    recursivelyTraverseMutationEffects(root, finishedWork);
    commitReconciliationEffects(finishedWork);
}
function recursivelyTraverseMutationEffects(
    root: FiberRoot,
    parentFiber: Fiber
) {
    let child = parentFiber.child;
    while (child !== null) {
        commitMutationEffects(root, child);
        child = child.sibling;
    }
}
// fiber.flags
// 新增插入
function commitReconciliationEffects(finishedWork: Fiber) {
    const flags = finishedWork.flags;
    if (flags & Placement) {
        commitPlacement(finishedWork);
        finishedWork.flags &= ~Placement;
    }

    if (flags & ChildDeletion) {
        // 获取⽗dom节点对应的fiber
        const parentFiber = isHostParent(finishedWork) ? finishedWork : getHostParentFiber(finishedWork);
        const parentDom = parentFiber.stateNode;
        commitDeletions(finishedWork.deletions, parentDom);
        finishedWork.flags &= ~ChildDeletion;
        finishedWork.deletions = null;
    }

    if (flags & Update) {
        if (finishedWork.tag === FunctionComponent) {
            // 执行 layout effect
            commitHookEffectListMount(HookLayout, finishedWork);
            finishedWork.flags &= ~Update;
        }
    }
}

function commitHookEffectListMount(hookFlags: HookFlags, finishedWork: Fiber) {
    const updateQueue = finishedWork.updateQueue;
    let lastEffect = updateQueue!.lastEffect;
    if (lastEffect !== null) {
        const firstEffect = lastEffect.next;
        let effect = firstEffect;
        do {
            if ((effect.tag & hookFlags) === hookFlags) {
                const create = effect.create;
                create();
            }
            effect = effect.next;
        } while (effect !== firstEffect);
    }
}

// 删除dom节点
function commitDeletions(
    deletions: Array<Fiber> | null,
    parentDom: Element | DocumentFragment | Document
) {
    deletions!.forEach(deletion => {
        parentDom.removeChild(getStateNode(deletion));
    });
}

// 获取fiber对应的dom节点
function getStateNode(fiber: Fiber) {
    let node = fiber;
    while (1) {
        if (isHost(node) && node.stateNode) {
            return node.stateNode;
        }
        node = node.child as Fiber;
        if (node === null) {
            throw new Error("Expected to find a host node. This error is likely caused by a bug in React. Please file an issue.");
        }
    }
}

function getHostSibling(fiber: Fiber) {
    let node = fiber;
    sibling: while (1) {
        while (node.sibling === null) {
            if (node.return === null || isHostParent(node.return)) {
                return null;
            }
            node = node.return;
        }
        node = node.sibling;
        while (!isHost(node)) {
            // 新增插入|移动位置
            if (node.flags & Placement) {
                continue sibling;
            }
            if (node.child === null) {
                continue sibling;
            } else {
                node = node.child;
            }
        }

        // hostComponent|hostText
        if (!(node.flags & Placement)) {
            return node.stateNode;
        }
    }
    return null;
}

// 是否存在before
function insertOrAppendPlacementNode(
    node: Fiber,
    before: Element,
    parent: Element
) {
    if (before) {
        parent.insertBefore(getStateNode(node), before);
    } else {
        parent.appendChild(getStateNode(node));
    }
}
// 在dom上，把⼦节点插入到⽗节点⾥
function commitPlacement(finishedWork: Fiber) {
    // 插入⽗dom
    if (finishedWork.stateNode && isHost(finishedWork)) {
        const parentFiber = getHostParentFiber(finishedWork);
        // 获取⽗dom节点
        let parentDom = parentFiber.stateNode;
        if (parentDom.containerInfo) {
            parentDom = parentDom.containerInfo;
        }
        // dom节点
        // 遍历fiber树，寻找finishedWork的兄弟节点，并且这个siblings是dom节点, 且是更新的节点，在本轮中不发生移动
        const before = getHostSibling(finishedWork);
        insertOrAppendPlacementNode(finishedWork, before, parentDom);
        // parent.appendChild(finishedWork.stateNode);
    } else {
        // 第二种fragment
        let kid = finishedWork.child;
        while (kid != null) {
            commitPlacement(kid);
            kid = kid.sibling;
        }
    }
}
// 返回 fiber 的⽗dom节点对应的fiber
function getHostParentFiber(fiber: Fiber): Fiber {
    let parent = fiber.return;
    while (parent !== null) {
        // 父节点且有dom节点
        if (isHostParent(parent)) {
            return parent;
        }
        parent = parent.return;
    }
    throw new Error(
        `"Expected to find a host parent. This error is likely caused by a
        "in React. Please file an issue."`
    );
}
// 检查 fiber 是否可以是⽗ dom 节点
function isHostParent(fiber: Fiber): boolean {
    return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

// todo 执行effect
export function flushPassiveEffects(finishedWork: Fiber) {
    recursivelyTraversePassiveMountEffects(finishedWork);
    commitPassiveEffects(finishedWork);
}

function recursivelyTraversePassiveMountEffects(finishedWork: Fiber) {
    let child = finishedWork.child;
    while (child !== null) {
        // 遍历子节点，检查子节点
        recursivelyTraversePassiveMountEffects(child);
        // 如果有passive effect，执行
        commitPassiveEffects(finishedWork);
        child = child.sibling;
    }
}

function commitPassiveEffects(finishedWork: Fiber) {
    switch (finishedWork.tag) {
        case FunctionComponent: {
            if (finishedWork.flags & Passive) {
                commitHookEffectListMount(HookPassive, finishedWork);
                finishedWork.flags &= ~Passive;
            }
            break;
        }
    }
}
