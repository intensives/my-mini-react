import { ReactDOM } from "../which-react";
import "./index.css";

const fragment1 = (
  <>
    <h3>1</h3>
    <h3>2</h3>
  </>
)
const jsx = (
  <div className="box border">
    <h1 className="border">omg</h1>
    <h2>react</h2>
    { fragment1 }
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