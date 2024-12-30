import { createFiber } from './ReactFiber';
import { Container, Fiber, FiberRoot } from './ReactInternalTypes';
import { HostRoot } from './ReactWorkTags';

export function createFiberRoot(containerInfo: Container):FiberRoot {
    const root: FiberRoot = new FiberRootNode(containerInfo);
    const uninitializedFiber = createFiber(HostRoot, null, null);
    root.current = uninitializedFiber;
    uninitializedFiber.stateNode = root;
    return root;
}

export function FiberRootNode(containerInfo: Container) {
    this.containerInfo = containerInfo;
    this.current = null;
    this.finishedWork = null;
    // this.pendingLanes = NoLanes;
    this.pendingLanes = 0;
}