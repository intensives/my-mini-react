import { useReducer } from "../../which-react";

export default function TestUseReducer() {
  const [count1, setCount1] = useReducer((x) => x + 1, 0);
  return (
    <div>
      <h3>函数组件</h3>
      <button onClick={() => setCount1()}>{count1}</button>
    </div>
  );
}
