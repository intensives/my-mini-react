import { ReactContext } from 'shared/ReactTypes';
import { createCursor, pop, push, StackCursor } from './ReactFiberStack';

const valueCursor: StackCursor<any> = createCursor(null);
export function pushProvider<T>(context: ReactContext<T>, nextValue: T): void {
    push(valueCursor, context._currentValue);
    // 把传入的值赋给context好处是如果有多个provider，可以通过context链找到对应的值
    context._currentValue = nextValue; // 当前的value是没有入栈的，入栈的是默认值
};

export function readContext<T>(context: ReactContext<T>): T{
    return context._currentValue;
};
export function popProvider<T>(context: ReactContext<T>): void{
    const currentValue = valueCursor.current;
    pop(valueCursor);
    context._currentValue = currentValue;
}