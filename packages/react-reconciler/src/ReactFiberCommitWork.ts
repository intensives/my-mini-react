import { isHost } from "./ReactFiberCompleteWork";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import { Fiber, FiberRoot } from "./ReactInternalTypes";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";
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
    const flags = finishedWork.flags; // 是否是根阶段，如果是就已经汇总了下面的子阶段，则提交，否则跳过
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
function getStateNode(fiber: Fiber)   {
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
// 在dom上，把⼦节点插入到⽗节点⾥
function commitPlacement(finishedWork: Fiber) {
    const parentFiber = getHostParentFiber(finishedWork);
    // 插入⽗dom
    if (finishedWork.stateNode && isHost(finishedWork)) {
        // 获取⽗dom节点
        let parent = parentFiber.stateNode;
        if (parent.containerInfo) {
            parent = parent.containerInfo;
        }
        // dom节点
        parent.appendChild(finishedWork.stateNode);
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