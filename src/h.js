// interface VNode {
//     _isVNode: true
//     el: Element | null
//     flags: VNodeFlags
//     tag: string | FunctionnalComponent | ComponentClass | null
//     data: VNodeData | null
//     children: VNodeChildren
//     childFlags: ChildrenFlags
// }

import { VNodeFlags, ChildrenFlags } from "./flags.js"

export const Fragment = Symbol('Fragment')
export const Portal = Symbol('Portal')

const normalizeVNodes = children => {
    return children.map((item, i) => {
        if (item.key == null) {
            item.key = `|${i}`
        }
        return item
    })
}

const createTextNode = text => {
    return {
        _isVNode: true,
        flags: VNodeFlags.TEXT,
        tag: null,
        data: null,
        children: text,
        childFlags: ChildrenFlags.NO_CHILDREN,
        el: null
    }
}

const normalizeClass = classList => {
    if (typeof classList === 'string') return classList
    else if (Array.isArray(classList)) {
        return classList.reduce((acc, cur) => {
            if (typeof cur === 'string') {
                 acc += ` ${cur}`
            } else {
                acc += normalizeClass(cur)
            }
            return acc
        }, '')
    } else if (typeof classList === 'object') {
        return Object.keys(classList).reduce((acc, cur) => {
            if (classList[cur]) acc += ` ${cur}`
            return acc
        }, '')
    }
}

export const h = (tag, data = null, children = null) => {
    // 创建时确定vnode的类型
    let flags = null
    if (typeof tag === 'string') {
        flags = tag === 'svg' ? VNodeFlags.ELEMENT_SVG : VNodeFlags.ELEMENT_HTML

         // 序列data中的class
        if (data && data.class) {
            data.class = normalizeClass(data.class)
        }
    } else if (tag === Fragment) {
        flags = VNodeFlags.FRAGMENT
    }else if (tag === Portal) {
        flags = VNodeFlags.PORTAL
        tag = data && data.target
    } else {

        // 兼容vue2的 对象式组件
        if (tag !== null && typeof tag === 'object') {
            flags = tag.functional
                ? VNodeFlags.COMPONENT_FUNCTIONAL       // 函数式组件
                : VNodeFlags.COMPONENT_STATEFUL_NORMAL  // 有状态组件
        } else if (typeof tag === 'function') {
            // vue3 的类组件
            flags = tag.prototype && tag.prototype.render
                ? VNodeFlags.COMPONENT_STATEFUL_NORMAL // 有状态组件
                : VNodeFlags.COMPONENT_FUNCTIONAL      // 函数式组件
        }
    }

    // 确定children类型
    let childFlags = null
    if (Array.isArray(children)) {
        const { length } = children
        if (length === 0) {
            // 没有children
            childFlags = ChildrenFlags.NO_CHILDREN
        } else if (length === 1) {
            // 单个节点
            childFlags = ChildrenFlags.SINGLE_VNODE
            children = children[0]
        } else {
            // 多个子节点，且子节点使用Key
            childFlags = ChildrenFlags.KEYED_VNODES
            children = normalizeVNodes(children)
        }
    } else if (children == null ) {
        // 没有子节点
        childFlags = ChildrenFlags.NO_CHILDREN
    } else if (children._isVNode){
        // 单个子节点
        childFlags = ChildrenFlags.SINGLE_VNODE
    } else {
        // 其他情况都作为文本节点处理，即单个子节点，会调用createTextNode 创建纯文本类型的 VNode
        childFlags = ChildrenFlags.TEXT
        children = createTextNode(children + '')
    }




    return {
        _isVNode: true,
        flags,
        tag,
        data,
        children,
        childFlags,
        el: null
    }
}
