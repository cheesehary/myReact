import React, { SFC } from "../src";
const ce = React.createElement;

class Counter extends React.Component<{}, { count: number }> {
  private didUpdate: boolean;

  constructor(props) {
    super(props);
    this.state = {
      count: 0
    };
    console.log("constructor Counter");
    this.didUpdate = false;
  }

  // componentDidMount() {
  //   console.log("component did mount");
  //   this.setState({ count: this.state.count + 1 });
  //   console.log(this.state.count);
  //   this.setState({ count: this.state.count + 1 });
  //   console.log(this.state.count);
  // }

  // componentWillMount() {
  //   this.setState({ count: this.state.count + 1 });
  //   console.log(this.state.count);
  // }

  componentDidUpdate() {
    if(this.didUpdate) {
      return;
    }
    this.didUpdate = true;
    this.setState({ count: this.state.count + 1 });
    console.log('did update, ', this.state.count);
  }

  addOne = (modifier: number) => {
    this.setState({ count: this.state.count + modifier });
    console.log('click, ', this.state.count);
    // this.setState({ count: this.state.count + 1 });
    // console.log(this.state.count);
    // Promise.resolve().then(() => {
    //   this.setState({ count: this.state.count + 1 });
    //   console.log(this.state.count);
    //   this.setState({ count: this.state.count + 1 });
    //   console.log(this.state.count);
    // });
  };

  render() {
    console.log("render Counter");
    const { count } = this.state;
    return ce(
      "div",
      {},
      count < 5
        ? ce("p", {}, `the number now is `, `${count}`)
        // : ce(
        //     "ul",
        //     {},
        //     ...Array(count)
        //       .fill("li")
        //       .map((item, i) => ce("li", { key: i }, item))
        //   ),
        : null,
      ce("p", {}, ce("button", { onClick: () => this.addOne(1) }, "add one")),
      ce("p", {}, ce("button", { onClick: () => this.addOne(-1) }, "minus one"))
    );
  }
}

const Header: SFC<{ name: string }> = ({ name }) => {
  console.log("render Header");
  return ce("p", {}, `hello ${name}!`);
};

class App extends React.Component<{}, { name: string }> {
  constructor(props) {
    super(props);
    this.state = {
      name: "myReact"
    };
    console.log("constructor App");
  }

  render() {
    console.log("render App");
    const { name } = this.state;
    return ce("div", {}, ce(Header, { name }), ce(Counter));
  }
}

React.render(ce(App), document.getElementById("app"));
