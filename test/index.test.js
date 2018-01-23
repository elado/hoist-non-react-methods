/*globals describe,it,beforeEach,context */

import { expect, assert } from 'chai'
import sinon from 'sinon'
import React, { Component } from 'react'
import ReactAddonsTestUtils from 'react-addons-test-utils'
import jsdom from 'jsdom'
import hoistNonReactMethods from '../src/index'

global.document = jsdom.jsdom('<!doctype html><html><body></body></html>')
global.window = document.defaultView
global.navigator = { userAgent: 'node.js' }

describe('hoist-non-react-methods', function () {
  let Child, Wrapper
  let wrapper, wrappedChild
  let initWrapper

  context('hoisted methods', function () {
    beforeEach(function () {
      Child = class extends Component {
        componentDidMount() {
          this.mountedChild = true
        }

        render() {
          return null
        }

        methodThatExistsInChild() {
          return 'methodThatExistsInChild'
        }

        static staticMethodInChild() {
          return 'staticMethodInChild'
        }

        methodThatExistsInChildAndIsCalledWithItsConext() {
          return 'Called ' + this._anotherMethodInChild()
        }

        _anotherMethodInChild() {
          return 'Child'
        }
      }

      Wrapper = class extends Component {
        componentDidMount() {
          this.mountedWrapper = true
        }

        render() {
          return <Child ref="child" />
        }
      }

      initWrapper = (options={}) => {
        hoistNonReactMethods(Wrapper, Child, options)
        wrapper = ReactAddonsTestUtils.renderIntoDocument(<Wrapper />),
        wrappedChild = wrapper.refs.child
      }
    })

    it('hoists non react prototype methods from child to wrapper', function () {
      initWrapper()
      expect(wrapper.methodThatExistsInChildAndIsCalledWithItsConext).to.exist
      expect(wrapper.methodThatExistsInChild()).to.eq('methodThatExistsInChild')
    })

    it('hoists non react static methods from child to wrapper', function () {
      initWrapper()
      expect(Wrapper.staticMethodInChild()).to.eq('staticMethodInChild')
    })

    it('doesn\'t hoists static methods when hoistStatics === false', function () {
      initWrapper({ hoistStatics: false })
      expect(Wrapper.staticMethodInChild).to.be.undefined
    })

    it('keeps react methods on wrapper and child', function () {
      initWrapper()
      expect(wrapper.mountedWrapper).to.be.true
      expect(wrappedChild.mountedChild).to.be.true
    })

    it('delegates hoisted methods in wrapper to child', function () {
      initWrapper()
      expect(wrapper.methodThatExistsInChildAndIsCalledWithItsConext()).to.eq('Called Child')
    })
  })

  context('conflict', function () {
    it('shows a warning when a method on the child already exists on the wrapper', function () {
      Child = class extends Component {
        render() {
          return null
        }

        methodThatExistsInBoth() {
          return 'methodThatExistsInBoth Child'
        }
      }

      Wrapper = class extends Component {
        render() {
          return <Child ref="child" />
        }

        methodThatExistsInBoth() {
          return 'methodThatExistsInBoth Wrapper'
        }
      }

      const consoleSpy = sinon.spy(console, 'warn')

      hoistNonReactMethods(Wrapper, Child)

      assert(consoleSpy.calledOnce, 'Warning not issued')
      assert(consoleSpy.calledWith("Method methodThatExistsInBoth already exists in wrapper component Wrapper, and won't be hoisted. Consider changing the name on Child."), 'Wrong warning message')

      consoleSpy.restore()
    })

    it('shows a warning when a method on the child already exists on the wrapper', function () {
      Child = class extends Component {
        render() {
          return null
        }

        static staticMethodThatExistsInBoth() {
          return 'staticMethodThatExistsInBoth Child'
        }
      }

      Wrapper = class extends Component {
        render() {
          return <Child ref="child" />
        }

        static staticMethodThatExistsInBoth() {
          return 'staticMethodThatExistsInBoth Wrapper'
        }
      }

      const consoleSpy = sinon.spy(console, 'warn')

      hoistNonReactMethods(Wrapper, Child)

      assert(consoleSpy.calledOnce, 'Warning not issued')
      assert(consoleSpy.calledWith('Static method staticMethodThatExistsInBoth already exists in wrapper component Wrapper, and won\'t be hoisted. Consider changing the name on Child.'), 'Wrong warning message')

      consoleSpy.restore()
    })
  })

  context('decorated component', function () {
    let wrapper
    let DecoratedComponent

    beforeEach(function () {
      function decorator() {
        return function (WrappedComponent) {
          class Wrapper extends Component {
            static displayName = `Wrapper(${WrappedComponent.displayName})`

            render() {
              return <WrappedComponent ref="wrappedComponent" />
            }
          }

          return hoistNonReactMethods(Wrapper, WrappedComponent, c => c.refs.wrappedComponent)
        }
      }

      @decorator()
      class Child extends Component {
        static displayName = 'Child'

        render() {
          return null
        }

        methodThatExistsInChild() {
          return 'methodThatExistsInChild'
        }
      }

      DecoratedComponent = Child
    })

    it('hoists methods from a decoraed component to wrapper', function () {
      wrapper = ReactAddonsTestUtils.renderIntoDocument(<DecoratedComponent />)

      expect(wrapper.methodThatExistsInChild()).to.eq('methodThatExistsInChild')
    })
  })
})
