# hoist-non-react-methods

> Copies non-react specific methods from a child component to a parent component

[![build status](https://img.shields.io/travis/elado/hoist-non-react-methods/master.svg?style=flat-square)](https://travis-ci.org/elado/hoist-non-react-methods) [![npm version](https://img.shields.io/npm/v/hoist-non-react-methods.svg?style=flat-square)](https://www.npmjs.com/package/hoist-non-react-methods) [![codeclimate](https://img.shields.io/codeclimate/github/elado/hoist-non-react-methods.svg?style=flat-square)](https://codeclimate.com/github/elado/hoist-non-react-methods)

**Inspired by @mridgway's [hoist-non-react-statics](https://github.com/mridgway/hoist-non-react-statics)**

When wrapping a component (see [Higher-Order Components](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750) methods that are defined in the child component aren't accessible anymore. This module makes those methods available on the wrapper component's prototype.

## Installation

```sh
npm install hoist-non-react-methods --save
```

## When is it needed?

Components can have public methods that are accessible through their instance under parent's `refs`.

```js
class Composer extends React.Component {
  render() {
    return <input type="text" ref="input" />
  }

  focus() {
    return this.input.focus()
  }
}

class Root extends React.Component {
  render() {
    <div>
      <button onClick={e => this.refs.composer.focus()}></button>
      <Composer ref="composer" />
    </div>
  }
}
```

Assuming you have a component which is decorated, the method `focus` will be lost, because the `ref` will point the decorator component.

```js
@someDecorator()
class Composer extends React.Component {
  render() {
    return <input type="text" ref="input" />
  }

  focus() {
    return this.input.focus()
  }
}

function someDecorator() {
  return function (WrappedComponent) {
    class Wrapper extends Component {
      static displayName = `Wrapper(${WrappedComponent.displayName})`

      componentWillMount() {
        // some specific logic in a decorator
      }

      render() {
        return <WrappedComponent ref="wrappedComponent" />
      }
    }

    return Wrapper
  }
}

class Root extends React.Component {
  // this.refs.composer.focus is undefined!
  render() {
    <div>
      <button onClick={e => this.refs.composer.focus()}></button>
      <Composer ref="composer" />
    </div>
  }
}
```

This package provides a function that copies all the methods (prototype and static) from the wrapped component to the wrapper, but keeps all react specific methods (e.g. `componentDidMount` etc.) untouched.

```js
@someDecorator()
class Composer extends React.Component {
  componentWillMount() {
    // some specific behavior of Composer isn't hoisted to wrapper
  }

  render() {
    return <input type="text" ref="input" />
  }

  static someStaticMethod() {

  }

  focus() {
    return this.input.focus()
  }
}

function someDecorator() {
  return function (WrappedComponent) {
    class Wrapper extends Component {
      static displayName = `Wrapper(${WrappedComponent.displayName})`

      componentWillMount() {
        // some specific logic in a decorator, left intact
      }

      render() {
        return <WrappedComponent ref="wrappedComponent" />
      }
    }

    return hoistNonReactMethods(Wrapper, WrappedComponent, c => c.refs.wrappedComponent)
  }
}

class Root extends React.Component {
  // works!
  render() {
    <div>
      <button onClick={e => this.refs.composer.focus()}></button>
      <Composer ref="composer" />
    </div>
  }
}
```

## API

```js
hoistNonReactMethods(
  Wrapper: ReactComponent,
  WrappedComponent: ReactComponent,
  delegateTo: function(ReactComponent wrapperComponentInstance):ReactComponent childComponentInstance
)
```

The third parameter is a function that gets the instance of the wrapper component and returns the instance of the wrapped component (e.g. `(wrapper) => wrapper.refs.child`)

## Test

```sh
npm install
npm test
```

## License

MIT
