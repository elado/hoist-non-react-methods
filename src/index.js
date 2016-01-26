import invariant from 'invariant'

const REACT_PROTOTYPE = {
  autobind: true,
  childContextTypes: true,
  componentDidMount: true,
  componentDidUpdate: true,
  componentWillMount: true,
  componentWillReceiveProps: true,
  componentWillUnmount: true,
  componentWillUpdate: true,
  contextTypes: true,
  displayName: true,
  forceUpdate: true,
  getChildContext: true,
  getDefaultProps: true,
  getDOMNode: true,
  getInitialState: true,
  isMounted: true,
  mixins: true,
  propTypes: true,
  render: true,
  replaceProps: true,
  replaceState: true,
  setProps: true,
  setState: true,
  shouldComponentUpdate: true,
  statics: true,
  updateComponent: true
}

const REACT_STATICS = {
  childContextTypes: true,
  contextTypes: true,
  defaultProps: true,
  displayName: true,
  getDefaultProps: true,
  mixins: true,
  propTypes: true,
  type: true
}

const KNOWN_STATICS = {
  name: true,
  length: true,
  prototype: true,
  caller: true,
  arguments: true,
  arity: true
}

export default function hoistNonReactMethods(targetComponent, sourceComponent, delegateTo=(w => w.refs.child)) {
  const targetComponentName = targetComponent.displayName || targetComponent.name || 'Wrapper'
  const sourceComponentName = sourceComponent.displayName || sourceComponent.name || 'WrappedComponent'

  const statics = Object.getOwnPropertyNames(sourceComponent)
    .filter(k => !REACT_STATICS[k] && !KNOWN_STATICS[k])

  statics.forEach(methodName => {
    invariant(!targetComponent[methodName], `Static method ${methodName} already exists in wrapper component ${targetComponentName}, and won't be hoisted. Consider changing the name on ${sourceComponentName}.`)
    targetComponent[methodName] = sourceComponent[methodName]
  })

  const methods = Object.getOwnPropertyNames(sourceComponent.prototype)
    .filter(k => !REACT_PROTOTYPE[k])

  methods.forEach(methodName => {
    invariant(!targetComponent.prototype[methodName], `Method ${methodName} already exists in wrapper component ${targetComponentName}, and won't be hoisted. Consider changing the name on ${sourceComponentName}.`)
    if (targetComponent.prototype[methodName]) return

    targetComponent.prototype[methodName] = function (...args) {
      return sourceComponent.prototype[methodName].call(delegateTo.call(this, this), ...args)
    }
  })

  return targetComponent
}
