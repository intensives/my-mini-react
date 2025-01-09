import { ReactNodeList } from 'shared/ReactTypes';
import { FiberRoot } from './ReactInternalTypes';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';

// ??? FiberRoot类型用container代替
export function updateContainer(element: ReactNodeList, container: FiberRoot) {
    // ! 1.获取current
    const current = container.current;
    // 放入element fiber 源码放在update上 这里简写
    current.memoizedState = { element };

    const root = container;
    console.log(
        "%c []-11",
        "color: #cc0033; font-weight: bold; font-size: 13px;",
        current
    )
    console.log(
        "%c []-11",
        "color: #cc0033; font-weight: bold; font-size: 13px;",
        container
    )
    
    // ! 2.调度更新
    scheduleUpdateOnFiber(root, current);
}