import { VNodeFlags, ChildrenFlags } from "./flags.js"

const mountElement = (vnode, container, isSVG) => {

    isSVG = isSVG || vnode.flags & VNodeFlags.ELEMENT_SVG
    const el = isSVG
        ? document.createElementNS('http://www.w3.org/2000/svg', vnode.tag)
        : document.createElement(vnode.tag)

    // VNodeData
    const data = vnode.data
    if (data) {
        for(let key in data) {
            // key可能是 style 、 class 、on 等等
            switch(key){
                case 'style':
                    for (let k in data.style) {
                        el.style[k] = data.style[k]
                    }
                    break;
                case 'class':
                    el.className = data[key]
                    break;

                default:
                    break
            }
        }
    }

    // 渲染children
    const { childFlags, children } = vnode
    if (childFlags !== ChildrenFlags.NO_CHILDREN) {
        if (childFlags & ChildrenFlags.SINGLE_VNODE) {
            // 如果是单个子节点
            mount(chidlren, el, isSVG)
        } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
            children.forEach(item => {
                mount(item, el, isSVG)
            })
        }
    }


    vnode.el = el
    container.appendChild(el)
}

const mountComponent = (vnode, container) => {
    const instance = new vnode.tag
    instance.$vnode = instance.render()
    mountElement(instance.$vnode, container)
}

const mountText = (vnode, container) => {

}

const mountFragment = (vnode, container) => {

}

const mountPortal = (vnode, container) => {

}


const mount = (vnode, container) => {
    const { flags } = vnode
    if (flags & VNodeFlags.ELEMENT) {
        // 挂载普通元素
        mountElement(vnode, container)
    } else if (flags & VNodeFlags.COMPONENT) {
        // 挂载组件
        mountComponent(vnode, container)
    } else if (flags & VNodeFlags.Text) {
        // 挂载纯文本
        mountText(vnode, container)
    } else if (flags & VNodeFlags.FRAGMENT) {
        // 挂载fragment
        mountFragment(vnode, container)
    } else if (flags & VNodeFlags.PORTAL) {
        // 挂载Portal
        mountPortal(vnode, container)
    }
}

const patch = (prevNode, vnode, container) => {

}


export const render = (vnode, container) => {
    const prevNode = container.vnode
    if (prevNode == null) {
        if (vnode) {
            // 如果没有旧的 vnode, 只有新的 vnode, 使用 'mount' 函数挂载全新的 VNode
            mount(vnode, container)
            container.vnode = vnode
        }
    } else {
        if (vnode) {
            // 有旧的vnode， 也有新的 vnode， 则调用 'patch' 函数打补丁
            patch(prevNode, vnode, container)
            container.vnode = vnode
        } else {
            // 有旧的 vnode，没有新的，则表示移除, 调用浏览器的语法移除元素
            container.removeChild(prevNode.el)
            container.vnode = null
        }
    }
}

