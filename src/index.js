


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



