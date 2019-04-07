import React from "../src";
const ce = React.createElement;

class Me extends React.Component<{ name: string }> {
  constructor(props) {
    super(props);
  }

  render() {
    const { name } = this.props;
    return ce("p", null, `my name is ${name}`);
  }
}

function Title(props) {
  return ce("p", null, "hello world!");
}

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return ce("div", null, ce(Title), ce(Me, { name: "myReact" }));
  }
}

React.render(ce(App), document.getElementById("app"));


