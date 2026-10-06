export function makeNodeProps(data) {
  return {
    id: 'node-1',
    type: 'sendMessage',
    selected: false,
    connectable: true,
    position: { x: 0, y: 0 },
    dimensions: { width: 208, height: 100 },
    dragging: false,
    resizing: false,
    zIndex: 0,
    events: {},
    parentNodeId: 'parent-1',
    sourcePosition: 'bottom',
    targetPosition: 'top',
    data,
  }
}
