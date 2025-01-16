import { REACT_PROFILER_TYPE, REACT_PROVIDER_TYPE } from "shared/ReactSymbols";
import { ReactContext } from "shared/ReactTypes";

export function createContext<T>(defaultValue: T): ReactContext<T>{
    const context: ReactContext<T> = {
        $$typeof: Symbol.for("react.context"),
        _currentValue: defaultValue,
        Provider: null,
        Consumer: null,
    };
    // todo
    context.Provider = {
        $$typeof: REACT_PROVIDER_TYPE,
        _context: context,
    }
    context.Consumer = context;
    return context;
};