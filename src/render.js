import { VNodeFlags, ChildrenFlags } from "./flags.js"
import { createTextVNode } from './h.js'
import { patch } from './patch.js'

// todo
export const patchData = (el, key, prevData, nextData) => {

}

const domPropsRE = /\[A-Z]^(?:value|checked|selected|muted)$/
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
                    if (key.startsWith('on')) {
                        // 事件
                        el.addEventListener(key.slice(2), data[key])
                    } else if (domPropsRE.test(key)) {
                        // 当做dom prop处理
                        el[key] = data[key]
                    } else {
                        // 当做 Attr 处理
                        el.setAttribute(key, data[key])
                    }
                    break
            }
        }
    }

    // 渲染children
    const { childFlags, children } = vnode
    if (childFlags !== ChildrenFlags.NO_CHILDREN) {
        if (childFlags & ChildrenFlags.SINGLE_VNODE) {
            // 如果是单个子节点
            mount(children, el, isSVG)
        } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
            children.forEach(item => {
                mount(item, el, isSVG)
            })
        }
    }


    vnode.el = el
    container.appendChild(el)
}

// 有状态组件
const mountStatefulComponent = (vnode, container, isSVG) => {
    console.log('mount stateful')
    // 创建组件实例
    const instance = new vnode.tag()
    //渲染vnode
    instance.$vnode = instance.render()
    // 挂载
    mount(instance.$vnode, container, isSVG)
    // el 和 组件的$el 都引用组件的根dom元素
    instance.$el = vnode.el = instance.$vnode.el
}

// 函数式组件
const mountFunctionalComponent = (vnode, container, isSVG) => {
    const $vnode = vnode.tag()

    mount($vnode, container ,isSVG)

    vnode.el = $vnode.el
}

// 组件挂载，分为有状态组件和函数式组件
const mountComponent = (vnode, container, isSVG) => {

    if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL) {
        mountStatefulComponent(vnode, container, isSVG)
    } else {
        mountFunctionalComponent(vnode, container, isSVG)
    }
}

const mountText = (vnode, container) => {
    const el = document.createTextNode(vnode.children)
    vnode.el = el
    container.appendChild(el)
}

const mountFragment = (vnode, container, isSVG) => {
    const { children, childFlags } = vnode

    switch(childFlags) {
        case ChildrenFlags.SINGLE_VNODE:
            mount(children, container, isSVG)
            // 单个节点，el指向该节点
            vnode.el = children.el
            break;
        case ChildrenFlags.NODE_KEYED_VNODES:
            // 如果没有子节点，等价于挂载空片段，会创建一个空的文本节点占位
            const placeholder = createTextVNode('')
            // 没有子节点，指向占位的空文本节点
            vnode.el = placeholder
            mountText(placeholder, container)
            break
        default:
            // 多个节点
            children.forEach(item => {
                mount(item, container, isSVG)
            })
            // 指向第一个子节点
            vnode.el = children[0].el
    }

}

const mountPortal = (vnode, container) => {
    const { tag, children , childFlags } = vnode
    const target = typeof tag === 'string' ? document.querySelector(tag) : tag

    if (childFlags & ChildrenFlags.SINGLE_VNODE) {
        mount(children, target)
    } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
        children.forEach(item => {
            mount(item, target)
        })
    }

    //占位的空文本节点
    const placeholder = createTextVNode('')
    // 挂载到container上
    mountText(placeholder, container)

    vnode.el = placeholder.el
}


export const mount = (vnode, container, isSVG) => {
    const { flags } = vnode
    if (flags & VNodeFlags.ELEMENT) {
        // 挂载普通元素
        mountElement(vnode, container, isSVG)
    } else if (flags & VNodeFlags.COMPONENT) {

        // 挂载组件
        mountComponent(vnode, container, isSVG)
    } else if (flags & VNodeFlags.TEXT) {
        // 挂载纯文本
        mountText(vnode, container)
    } else if (flags & VNodeFlags.FRAGMENT) {
        // 挂载fragment
        mountFragment(vnode, container, isSVG)
    } else if (flags & VNodeFlags.PORTAL) {
        // 挂载Portal
        mountPortal(vnode, container)
    }
}


/**
 * 将vnode，渲染成实际dom
 * @param {VNode} vnode
 * @param {DOM} container
 */
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

