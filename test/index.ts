import React, { SFC } from "../src";
const ce = React.createElement;

class Counter extends React.Component<{}, { count: number }> {
  constructor(props) {
    super(props);
    this.state = {
      count: 0
    };
  }

  render() {
    const { count } = this.state;
    return ce("p", null, `the number now is ${count}`);
  }
}

const Header: SFC<{ name: string }> = ({ name }) => {
  return ce("p", null, `hello ${name}!`);
};

class App extends React.Component<{}, { name: string }> {
  constructor(props) {
    super(props);
    this.state = {
      name: "myReact"
    };
  }

  render() {
    const { name } = this.state;
    return ce("div", null, ce(Header, { name }), ce(Counter));
  }
}

React.render(ce(App), document.getElementById("app"));
