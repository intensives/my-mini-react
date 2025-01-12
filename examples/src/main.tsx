import { Component, Fragment, ReactDOM, useReducer } from "../which-react";
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
  const [count1, setCount1] = useReducer((x) => x + 1, 0);

  console.log('%c [  ]-40', 'font-size:13px; background:pink; color:#bf2c9f;', count1);
  return (
    <div className="border">
      {/* f**k */}
      {/* <h3>函数组件</h3> */} 
      <button
        onClick={() => {
          setCount1();
          // console.log("click"); //sy-log
        }}
      >
        {count1}
      </button>
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