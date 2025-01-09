import { Component, Fragment, ReactDOM } from "../which-react";
import "./index.css";

let fragment1 = (
  <>
    <h3>1</h3>
    <h3>2</h3>
  </>
)
fragment1 = (
  <Fragment key="1">
    <>
      <h3>o</h3>
    </>
    <h3>1</h3>
    <h3>2</h3>
  </Fragment>
)
class ClassComponent extends Component {
  render() {
    return (
      <div>
        <h3> { this.props.name }</h3>
      </div>
    );
  }
}

function FunctionComponent( { name }: {name: string}) {
  return (
    <div>
      <h3> { name }</h3>
    </div>
  );
} 
const jsx = (
  <div className="box border">
    <FunctionComponent name="函数组件"/>
    <ClassComponent name="类组件"/>
    <h1 className="border">omg</h1>
    <h2>react</h2>
    {fragment1}
    omg
  </div>
)

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);

// div.root 对应的是根fiber，Fiber, tag = HostRoot=3
// 原⽣标签Fiber, tag = HostComponent=5
// Host
// 1. HostRoot
// 2. HostComponent
// 3. HostText // 不能⼦节点