import { VNodeFlags, ChildrenFlags } from "./flags.js";
import { mount } from './render.js'


// 合并VNodeData
const domPropsRE = /\[A-Z]^(?:value|checked|selected|muted)$/
export const patchData = (el, key, prevValue, nextValue) => {
    switch(key){
        case 'style':

            for(let k in nextValue) {
                el.style[k] = nextValue[k]
            }


            for (let k in prevValue) {
                if (!nextValue.hasOwnProperty(k)) {
                    el.style[k] = ''
                }
            }

            break;
        case 'class':
            el.className = nextValue ? nextValue : ''
            break;
        default:
            if (key.startsWith('on')) {
                // 事件
                if (prevValue) {
                    el.removeEventListener(key.slice(2), prevValue)
                }
                if (nextValue) {
                    el.addEventListener(key.slice(2), nextValue)
                }
            } else if (domPropsRE.test(key)) {
                // 当做dom prop处理
                el[key] = nextValue ? nextValue :''
            } else {
                // 当做 Attr 处理
                nextValue ? el.setAttribute(key, nextValue) : el.removeAttribute(key)
            }
            break
    }
}

const removeVNode = (VNode, container) => {
    const { flags, children } = VNode
    if (flags & VNodeFlags.FRAGMENT) {
        children.forEach(item => {
            container.removeChild(item.el)
        })
    } else {
        container.removeChild(VNode.el)
    }
}

const patchChildren = (prevChildFlags, nextChildFlags, prevChildren, nextChildren, container) => {
    console.log(prevChildFlags,nextChildFlags )
    switch(prevChildFlags) {
        // 旧的子节点，是单个子节点
        case ChildrenFlags.SINGLE_VNODE:
            switch (nextChildFlags) {
                case ChildrenFlags.SINGLE_VNODE:
                    // 都是为单vnode， 走patch
                    patch(prevChildren, nextChildren, container)
                    break
                case ChildrenFlags.NO_CHILDREN:
                    // 新的children 里没有子节点，执行移除操作
                    removeVNode(prevChildren, container)
                    break;
                default:
                    // 新的children 有多个子节点
                    // 先移除prevChildren
                    removeVNode(prevChildren, container)
                    // 循环挂载nextChildren
                    nextChildren.forEach(item => {
                        mount(item, container)
                    })
                    break
            }
            break

        case ChildrenFlags.NO_CHILDREN:
            switch (nextChildFlags) {
                case ChildrenFlags.SINGLE_VNODE:
                    mount(nextChildren, container)
                    break
                case ChildrenFlags.NO_CHILDREN:
                    // 新的children 里没有子节点， 什么都不用做
                    break;
                default:
                    // 新的children 有多个子节点
                    nextChildren.forEach(item => {
                        mount(item, container)
                    })
                    break
            }
            break

        default:
            switch (nextChildFlags) {
                case ChildrenFlags.SINGLE_VNODE:
                    prevChildren.forEach(item => {
                        removeVNode(item, container)
                    })
                    mount(nextChildren, container)
                    break
                case ChildrenFlags.NO_CHILDREN:
                    // 新的children 里没有子节点
                    prevChildren.forEach(item => {
                        removeVNode(item, container)
                    })

                    break;
                default:
                    // 核心diff算法
                    prevChildren.forEach(item => {
                        removeVNode(item, container)
                    })
                    nextChildren.forEach(item => {
                        mount(item, container)
                    })
                    break
            }
            break
    }
}

const repalceVNode = (prevVNode, nextVNode, container) => {
    // container.removeChild(prevVNode.el)
    removeVNode(prevVNode, container)
    mount(nextVNode, container)
    console.log(container.vnode)
}

const patchElement = (prevVNode, nextVNode, container) => {
    // 如果新旧元素不同，则直接调用replaceVNode
    if (prevVNode.tag !== nextVNode.tag) {
        repalceVNode(prevVNode, nextVNode, container)
        return
    }

    // 拿到 el
    const el = (nextVNode.el = prevVNode.el)
    const prevData = prevVNode.data
    const nextData = nextVNode.data

    if (nextData) {
        // 遍历新的VNodeData
        for (let key in nextData) {
            const prevValue = prevData[key]
            const nextValue = nextData[key]

            patchData(el, key, prevValue, nextValue)
        }
    }

    if (prevData) {
        // 遍历旧的VNodeData, 将已经不存在新的VNodeData中的数据移除
        for (let key in prevData) {
            const prevValue = prevData[key]
            if (prevValue && !nextData.hasOwnProperty(key)) {
                // 第四个参数为null， 代表移除数据
                patchData(el, key, prevValue, null)
            }
        }
    }

    patchChildren(
        prevVNode.childFlags,
        nextVNode.childFlags,
        prevVNode.children,
        nextVNode.children,
        el
    )
}

const patchComponent = (prevVNode, nextVNode, container) => {

}

const patchText = (prevVNode, nextVNode, container) => {
    const el = (nextVNode.el = prevVNode.el)
    if (nextVNode.children !== prevVNode.children) {
        el.nodeValue  = nextVNode.children
    }
}

const patchFragment = (prevVNode, nextVNode, container) => {
    patchChildren(
        prevVNode.childFlags,
        nextVNode.childFlags,
        prevVNode.children,
        nextVNode.children,
        container
    )

    // 调整nextVNode的el
    switch(nextVNode.childFlags) {
        case ChildrenFlags.SINGLE_VNODE:
            nextVNode.el = nextVNode.children.el
            break
        case ChildrenFlags.NO_CHILDREN:
            nextVNode.el = prevVNode.el
            break
        default:
            nextVNode.el = nextVNode.children[0].el
    }
}

const patchPortal = (prevVNode, nextVNode, container) => {

}

export function patch (prevVNode, nextVNode, container)  {
    const prevFlags = prevVNode.flags
    const nextFlags = nextVNode.flags

    if (prevFlags !== nextFlags) {
        // 如果两个vnode的flags不一致，直接替换
        repalceVNode(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.ELEMENT) {
        // 如果都是元素
        patchElement(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.COMPONENT) {
        // 如果都是组件
        patchComponent(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.TEXT) {
        // 如果都是文本
        patchText(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.FRAGMENT) {
        // 如果都是Fragment
        patchFragment(prevVNode, nextVNode,container)
    } else if(nextFlags & VNodeFlags.PORTAL) {
        // 如果都是portal
        patchPortal(prevVNode, nextVNode, container)
    }
}