import React, { SFC } from "../src";
const ce = React.createElement;

class Counter extends React.Component<{}, { count: number }> {
  constructor(props) {
    super(props);
    this.state = {
      count: 0
    };
    console.log("constructor Counter");
  }

  addOne = () => {
    this.setState({ count: this.state.count + 1 });
    console.log(this.state.count);
  };

  render() {
    console.log("render Counter");
    const { count } = this.state;
    return ce(
      "div",
      null,
      ce("p", null, `the number now is ${count}`),
      ce("p", null, ce("button", { onClick: this.addOne }, "add one"))
    );
  }
}

const Header: SFC<{ name: string }> = ({ name }) => {
  console.log("render Header");
  return ce("p", null, `hello ${name}!`);
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
    return ce("div", null, ce(Header, { name }), ce(Counter));
  }
}

React.render(ce(App), document.getElementById("app"));
