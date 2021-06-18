
const VNodeFlags = {
    // html 标签
    ELEMENT_HTML: 1,
    // SVG
    ELEMENT_SVG: 1 << 1,

    // 普通有状态组件
    COMPONENT_STATEFUL_NORMAL: 1 << 2,
    // 需要被KeepAlive的有状态组件
    COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE: 1 << 3,
    // 已经被KeepAlive的有状态组件
    COMPONENT_STATEFUL_KEPT_ALIVE: 1 << 4,
    // 函数式组件
    COMPONENT_FUNCTIONAL: 1 << 5,

    // 纯文本
    TEXT: 1 << 6,
    // Fragment
    FRAGMENT: 1 << 7,
    // Portal
    PORTAL: 1 << 8
}

// html 和 svg
VNodeFlags.ELEMENT = VNodeFlags.ELEMENT_HTML | VNodeFlags.ELEMENT_SVG

// 有状态组件
VNodeFlags.COMPONENT_STATEFUL =
    VNodeFlags.COMPONENT_STATEFUL_NORMAL |
    VNodeFlags.COMPONENT_STATEFUL_KEPT_ALIVE |
    VNodeFlags.COMPONENT_STATEFUL_SHOULD_KEPT_ALIVE

// 状态组件和函数组件 统称为"组件"
VNodeFlags.COMPONENT = VNodeFlags.COMPONENT_STATEFUL | VNodeFlags.COMPONENT_FUNCTIONAL


const ChildrenFlags = {
    // 未知的 children 类型
    UNKNOWN_CHILDREN: 0,

    // 没有 children
    NO_CHILDREN: 1,
    // children 是单个 vnode
    SINGLE_VNODE: 1 << 1,

    // children 是多个拥有key的vnode
    KEYED_VNODES: 1 << 2,
    // children 是多个么有 key 的 vnode
    NODE_KEYED_VNODES: 1 << 3
}

// 多节点归为一类
ChildrenFlags.MULTIPLE_VNODES = ChildrenFlags.KEYED_VNODES | ChildrenFlags.NODE_KEYED_VNODES

export { VNodeFlags, ChildrenFlags }