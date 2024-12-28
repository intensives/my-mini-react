export type Heap<T extends Node> = Array<T>;
export type Node = {
    id: number; // 唯一标识
    sortIndex: number;
};

export function peek<T extends Node>(heap: Heap<T>): T | null { // 返回堆顶元素
    return heap.length === 0 ? null : heap[0];
};

// 交换插入一个元素
export function push<T extends Node>(heap: Heap<T>, node: T): void { // 插入元素
    let index = heap.length;
    heap.push(node);
    siftUp(heap, node, index);
};
function siftUp<T extends Node>(heap: Heap<T>, node: T, i: number): void {
    let index = i;
    while (index > 0) {
        let parentIndex = (index - 1) >>> 1;
        let parent = heap[parentIndex];
        if (compare(parent, node) >= 0) {
            // 可以找到最后一个节点再交换
            heap[index] = parent;
            heap[parentIndex] = node;
            index = parentIndex;
        } else {
            return;
        }
    }
}
export function pop<T extends Node>(heap: Heap<T>): T | null {
    let first = heap[0];
    let last = heap.pop()!; // 数组方法 栈
    if (first !== last) {
        heap[0] = last;
        siftDown(heap, last, 0);
    }
    return first;
}
function siftDown<T extends Node>(heap: Heap<T>, node: T, i: number): void {
    let index = i;
    const length = heap.length;
    const halfLength = length >>> 1;
    while (index < halfLength) {
        const leftIndex = (index + 1) * 2 - 1;
        const left = heap[leftIndex];
        const rightIndex = leftIndex + 1;
        const right = heap[rightIndex];
        if (compare(left, node) < 0) {
            if (rightIndex < length && compare(right, left) < 0) {
                heap[index] = right;
                heap[rightIndex] = node;
                index = rightIndex;
            } else {
                heap[index] = left;
                heap[leftIndex] = node;
                index = leftIndex;
            }
        } else if (rightIndex < length && compare(right, node) < 0) {
            heap[index] = right;
            heap[rightIndex] = node;
            index = rightIndex;
        } else {
            return;
        }
    }
}

function compare(a: Node, b: Node) {
    let diff = a.sortIndex - b.sortIndex;
    return diff !== 0 ? diff : a.id - b.id;
}