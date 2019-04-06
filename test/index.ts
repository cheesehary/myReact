class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return React.createElement("p", null, "hello world");
  }
}

React.render(React.createElement(App), document.getElementById("app"));
