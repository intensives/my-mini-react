import type { Container, FiberRoot } from "react-reconciler/src/ReactInternalTypes";
import { createFiberRoot } from "react-reconciler/src/ReactFiberRoot";
import { updateContainer } from "react-reconciler/src/ReactFiberReconciler";
import type { ReactNodeList } from 'shared/ReactTypes';
import { listenToAllSupportedEvents } from "react-dom-bindings/src/events/DOMPluginEventSystem";

// 为什么ReactNodeList不是ReactNode[]类型呢？
type RootType = {
    render: (children: ReactNodeList) => void;
    _internalRoot: FiberRoot;
}

function ReactDOMRoot(this: RootType, internalRoot: FiberRoot) {
    this._internalRoot = internalRoot;
}

ReactDOMRoot.prototype.render = function (children: ReactNodeList) {
    updateContainer(children, this._internalRoot);
}

export function createRoot(container: Container): RootType {
    const root: FiberRoot = createFiberRoot(container);
    listenToAllSupportedEvents(container);
    // new 一个对象 js版本的class
    return new (ReactDOMRoot as any)(root);
}

export default {
    createRoot,
}