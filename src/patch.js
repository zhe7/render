import { VNodeFlags, ChildrenFlags } from "./flags.js";
import { mount } from './render.js'

const repalceVNode = (prevVNode, nextVNode, container) => {
    container.removeChild(prevVNode.el)
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

            switch (key) {
                case 'style':
                    // 新样式覆盖到 el
                    for(let k in nextValue) {
                        el.style[k] = nextValue[k]
                    }
                    // 不存在nextValue中的样式 移除掉
                    for (let k in prevValue) {
                        if (!nextValue.hasOwnProperty(k)) {
                            el.style[k] = ''
                        }
                    }
                    break
                default:
                    break
            }
        }
    }
}

const patchComponent = (prevVNode, nextVNode, container) => {

}

const patchText = (prevVNode, nextVNode, container) => {

}

const patchFragment = (prevVNode, nextVNode, container) => {

}

const patchPortal = (prevVNode, nextVNode, container) => {

}

export const patch = (prevVNode, nextVNode, container) => {
    const prevFlags = prevVNode.flags
    const nextFlags = nextVNode.flags

    if (prevFlags !== nextFlags) {
        repalceVNode(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.ELEMENT) {
        patchElement(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.COMPONENT) {
        patchComponent(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.TEXT) {
        patchText(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.FRAGMENT) {
        patchFragment(prevVNode, nextVNode,container)
    } else if(nextFlags & VNodeFlags.PORTAL) {
        patchPortal(prevVNode, nextVNode, container)
    }
}