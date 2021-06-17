const VNodeFlags = {
    // html 标签
    ELMENT_HTML: 1,
    // SVG
    ELEMENT_SVG: 1 << 1,

    // 普通有状态组件
    COMPONENT_STATEFUL_NORMAL: 1 << 2,
    // 需要被KeepAlive的有状态组件
    COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE: 1 << 3,
    // 已经被KeepAlive的有状态组件
    COMPONENT_STATEFUL_KEEP_ALIVE: 1 << 4,
    // 函数式组件
    COMPONENT_FUNCTIONAL: 1 << 5,

    // 纯文本
    TEXT: 1 << 6,
    // Fragment
    FRAGMENT: 1 << 7,
    // Portal
    PORTAL: 1 << 8
}

class MyComponent {
    render () {
        return {
            tag: 'div'
        }
    }
}

const Fragment = Symbol()
const fragemntVNode = {
    tag: Fragment,
    data: null,
    children: [
        {
            tag: 'td',
            data: null
        },
        {
            tag: 'td',
            data: null
        }
    ]
}

const Portal = Symbol()
const portalVNode = {
    tag: Portal,
    data: {
        target: '#app'
    },
    children: [
        {
            tag: 'div'
        }
    ]
}





const mountElement = (vnode, container) => {
    const el = document.createElement(vnode.tag)
    container.appendChild(el)
}

const mountComponent = (vnode, container) => {
    const instance = new vnode.tag
    instance.$vnode = instance.render()
    mountElement(instance.$vnode, container)
}

export const render = (vnode, container) => {
    if (typeof vnode.tag === 'string') {
        mountElement(vnode, container)
    } else {
        // 组件
        mountComponent(vnode, container)
    }
}



