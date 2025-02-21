import { useReducer, useState } from "../../which-react";

function FunctionComponent() {
  const [count1, setCount1] = useReducer((x) => x + 1, 1);
  const [count2, setCount2] = useState(1);
  const _cls = count2 % 2 === 0 ? "red green_bg" : "green red_bg";
  // const arr = count1 % 2 === 0 ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
  const arr = count1 % 2 === 0 ? [0, 1, 2, 3, 4] : [0, 1, 2, 4];
  // const arr = count1 % 2 === 0 ? [0, 1, 2, 3, 4] : [3, 1, 0, 4, 2];
  // old 0, 1, 2, 4
  // new 0, 1, 2, 3, 4
  // 1个before 4
  // old 3, 2, 0, 4, 1
  // new 0, 1, 2, 3, 4
  // 3个before null
  // 0 删除
  return (
    <div className="border">
      <h3 className={_cls}>函数组件</h3>
      <button
        onClick={() => {
          setCount1();
        }}
      >
        {count1}
      </button>
      <button
        onClick={() => {
          setCount2(count2 + 1);
        }}
      >
        {count2}
      </button>
      <ul>
        {arr.map((item) => (
          <li key={"li" + item}>{item}</li>
        ))}
      </ul>
      {count1 % 2 === 0 ? <h1>null</h1> : null}
      {count1 % 2 === 0 ? <h1>undefined</h1> : undefined}
      {count1 % 2 === 0 && <h1>boolean</h1>}
    </div>
  );
}

export default FunctionComponent;
