import { Fiber } from "react-reconciler/src/ReactInternalTypes";

const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = "__reactFiber$" + randomKey;
const internalPropsKey = "__reactProps$" + randomKey;

// 存值
export function precacheFiberNode(hostInst: Fiber, node: Element | Text): void {
  // 给每个节点添加一个fiber实例的引用
  (node as any)[internalInstanceKey] = hostInst;
}

// 取值 去element上找到对应的fiber实例
export function getClosestInstanceFromNode(targetNode: Node): null | Fiber {
  let targetInst = (targetNode as any)[internalInstanceKey];
  if (targetInst) {
    // Don't return HostRoot or SuspenseComponent here.
    return targetInst;
  }

  return null;
}

export function getFiberCurrentPropsFromNode(node: Element | Text) {
  return (node as any)[internalPropsKey] || null;
}

export function updateFiberProps(node: Element | Text, props: any): void {
  (node as any)[internalPropsKey] = props;
}
