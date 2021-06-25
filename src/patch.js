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

export const getElement = container =>
    typeof container === 'string'
    ? document.querySelector(container)
    : container

const removeVNode = (VNode, container) => {
    const { flags, children } = VNode
    container = getElement(container)

    if (flags & VNodeFlags.FRAGMENT) {
        children.forEach(item => {
            container.removeChild(item.el)
        })
    } else {
        container.removeChild(VNode.el)
    }
}

const patchChildren = (prevChildFlags, nextChildFlags, prevChildren, nextChildren, container) => {
    console.log(container)
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

                    // react diff算法
                    // 用来存储寻找过程中遇到的最大索引值
                    // let lastIndex = 0

                    // for (let i = 0; i < nextChildren.length; i++ ) {
                    //     const nextVNode = nextChildren[i]
                    //     let find = false

                    //     for (let j = 0;  j < prevChildren.length; j++) {
                    //         const prevVNode = prevChildren[j]
                    //         if (nextVNode.key === prevVNode.key) {
                    //             find = true
                    //             patch(prevVNode, nextVNode, container)

                    //             if (j < lastIndex) {
                    //                 // 需要移动
                    //                 const refNode = nextChildren[i-1].el.nextSibling
                    //                 // 通过insertBefore 移动 dom
                    //                 container.insertBefore(nextVNode.el, refNode)
                    //             } else {
                    //                 lastIndex = j
                    //             }
                    //             break;
                    //         }
                    //     }

                    //     if (!find) {
                    //         const refNode = i === 0 ? prevChildren[0].el : nextChildren[i-1].el.nextSibling
                    //         mount(nextVNode, container, false, refNode)
                    //     }
                    // }

                    // prevChildren.forEach(item => {
                    //     if (!nextChildren.some(next => next.key === item.key)) {
                    //         removeVNode(item, container)
                    //     }
                    // })

                    // diff 算法：双端比较法，vue2.x采用的
                    let oldStartIdx = 0
                    let oldEndIdx = prevChildren.length - 1
                    let newStartIdx = 0
                    let newEndIdx = nextChildren.length - 1

                    let oldStartVNode = prevChildren[oldStartIdx]
                    let oldEndVNode = prevChildren[oldEndIdx]
                    let newStartVNode = nextChildren[newStartIdx]
                    let newEndVNode = nextChildren[newEndIdx]

                    while(oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx ) {
                        if (!oldStartVNode) {
                            // 如果不存在这个节点，说明此节点是被移动过，为undefined
                            // 所以向后位移一位
                            oldStartVNode = prevChildren[++oldStartIdx]
                        } else if (!oldEndVNode) {
                            // 如果不存在这个节点，说明此节点是被移动过，为undefined
                            // 所以向前位移一位
                            oldEndVNode = prevChildren[--oldEndIdx]
                        } else if (oldStartVNode.key === newStartVNode.key) {
                            console.log(1)
                            patch(oldStartVNode, newStartVNode, container)

                            // 更新索引
                            oldStartVNode = prevChildren[++oldStartIdx]
                            newStartVNode = nextChildren[++newStartIdx]

                        } else if (oldEndVNode.key === newEndVNode.key) {
                            console.log(2)
                            patch(oldEndVNode, newEndVNode, container)

                            // 更新索引
                            oldEndVNode = prevChildren[--oldEndIdx]
                            newEndVNode = nextChildren[--newEndIdx]

                        } else if (oldStartVNode.key === newEndVNode.key) {
                            console.log(3)

                            patch(oldStartVNode, newEndVNode, container)

                            container.insertBefore(oldStartVNode.el, oldEndVNode.el.nextSibling)

                            // 更新索引
                            oldStartVNode = prevChildren[++oldStartIdx]
                            newEndVNode = nextChildren[--newEndIdx]

                        } else if (oldEndVNode.key === newStartVNode.key) {
                            console.log(4)
                            // 先patch更新节点
                            patch(oldEndVNode, newStartVNode, container)
                            // 把old的最后一个节点更新到第一个
                            container.insertBefore(oldEndVNode.el, oldStartVNode.el)

                            // 更新索引
                            oldEndVNode = prevChildren[--oldEndIdx]
                            newStartVNode = nextChildren[++newStartIdx]
                        } else {
                            // 如果双端都匹配不上
                            // 遍历旧的children, 找到与newStartVNode key相等的节点，将此节点的dom 移动到最前面
                            const idxInOld = prevChildren.findIndex(item => item.key === newStartVNode.key)
                            if (idxInOld >= 0) {
                                const vnodeToMove = prevChildren[idxInOld]
                                patch(vnodeToMove, newStartVNode, container)
                                // 移动到最前面
                                container.insertBefore(vnodeToMove.el, oldStartVNode.el)
                                // 由于旧children中该位置的节点所对应的真实dom已经被移动，所以将其设置为undefined
                                prevChildren[idxInOld] = undefined
                            } else {
                                // 如果没找到，则认定为新增
                                mount(newStartVNode, container, false, oldStartVNode.el)
                            }
                            // 将newStartIdx 下移一位
                            newStartVNode = nextChildren[++newStartIdx]
                        }
                    }

                    if (oldEndIdx < oldStartIdx) {
                        // 添加新节点
                        for(let i = newStartIdx; i <= newEndIdx; i++) {
                            mount(nextChildren[i], container, false , oldStartVNode.el)
                        }
                    } else if (newEndIdx < newStartIdx ) {
                        // 移除old节点
                        for (let i = oldStartIdx; i <= oldEndIdx; i++) {
                            removeVNode(prevChildren[i], container)
                        }
                    }

                    break
            }
            break
    }
}

const repalceVNode = (prevVNode, nextVNode, container) => {
    // container.removeChild(prevVNode.el)
    removeVNode(prevVNode, container)

    //如果被移除的vnode是组件类型，则需要调用改组件实例的unmounted钩子函数
    if (prevVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
        const instance = prevVNode.children
        instance.unmounted && instance.unmounted()
    }

    mount(nextVNode, container)

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
    console.log(prevVNode, nextVNode)

    // tag属性指向组件类，通过对比判定是否为相同的组件
    if (nextVNode.tag !== prevVNode.tag) {
        repalceVNode(prevVNode, nextVNode, container)
    }else if (nextVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
        // 1.获取组件实例
        const instance = nextVNode.children = prevVNode.children
        // 2.更新props
        instance.$props = nextVNode.data
        // 3.更新组件
        instance._update()
    } else {
        // 函数式组件的更新
        // 通过prevVNode 拿到handle对象
        const handle = nextVNode.handle = prevVNode.handle
        // 更新handle对象
        handle.prev = prevVNode
        handle.next = nextVNode
        handle.container = container

        handle.update()
    }
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

const patchPortal = (prevVNode, nextVNode) => {
    patchChildren(
        prevVNode.childFlags,
        nextVNode.childFlags,
        prevVNode.children,
        nextVNode.children,
        prevVNode.tag
    )

    nextVNode.el = prevVNode.el

    // 如果新旧container不同，需要搬运
    if (nextVNode.tag !== prevVNode.tag) {
        const container = getElement(nextVNode.tag)

        switch(nextVNode.childFlags) {
            case ChildrenFlags.SINGLE_VNODE:
                container.appendChild(nextVNode.children.el)
                break
            case ChildrenFlags.NO_CHILDREN:
                break
            default:
                nextVNode.children.forEach(item => {
                    container.appendChild(item.el)
                })
                break
        }
    }
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