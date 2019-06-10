import React from "react";
import ReactDOM from "react-dom";
const ce = React.createElement;

class Counter extends React.Component {
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
  //   // Promise.resolve().then(() => {
  //   //   console.log("component did mount");
  //   //   console.log(this.state.count);
  //   //   this.setState({ count: this.state.count + 1 });
  //   //   console.log(this.state.count);
  //   //   this.setState({ count: this.state.count + 1 });
  //   //   console.log(this.state.count);
  //   // });
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

  addOne = () => {
    this.setState({ count: this.state.count + 1 });
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
        : ce(
            "ul",
            {},
            ...Array(count)
              .fill("li")
              .map((item, i) => ce("li", { key: i }, item))
          ),
      ce("p", {}, ce("button", { onClick: this.addOne }, "add one"))
    );
  }
}

const Header = ({ name }) => {
  console.log("render Header");
  return ce("p", {}, `hello ${name}!`);
};

class App extends React.Component {
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

ReactDOM.render(ce(App), document.getElementById("app"));
