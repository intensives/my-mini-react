import { Component, Fragment, ReactDOM, useReducer, useState } from "../which-react";
import "./index.css";

let fragment1 = (
  <>
    <h3>1</h3>
    <h3>2</h3>
  </>
)
// fragment1 = (
//   <Fragment key="1">
//     <>
//       <h3>o</h3>
//     </>
//     <h3>1</h3>
//     <h3>2</h3>
//   </Fragment>
// )
class ClassComponent extends Component {
  render() {
    return (
      <div>
        <h3> {this.props.name}</h3>
      </div>
    );
  }
}

// function FunctionComponent( { name }: {name: string}) {
//   return (
//     <div>
//       <h3> { name }</h3>
//     </div>
//   );
// } 

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
const jsx = (
  <div className="box border">
    <FunctionComponent name="函数组件" />
    <ClassComponent name="类组件" />
    <h1 className="border">omg</h1>
    <h2>react</h2>
    {fragment1}
    omg
  </div>
)

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<FunctionComponent />);

// div.root 对应的是根fiber，Fiber, tag = HostRoot=3
// 原⽣标签Fiber, tag = HostComponent=5
// Host
// 1. HostRoot
// 2. HostComponent
// 3. HostText // 不能⼦节点