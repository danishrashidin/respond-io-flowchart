import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRefHistory } from '@vueuse/core'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { get as getPayload, post as updatePayload } from '@/lib/api/payload'
import { useRouteParams } from '@vueuse/router'
import { useVueFlow } from '@vue-flow/core'

export const useFlowStore = defineStore('flow', () => {
  const activeNodeId = useRouteParams('nodeId')
  const vueFlow = useVueFlow()
  const nodes = ref([])
  const nodesHistory = useRefHistory(nodes, {
    deep: true,
  })
  const edges = ref([])
  const edgesHistory = useRefHistory(edges, {
    deep: true,
  })
  const { data: flowData } = useQuery({
    queryKey: ['flow'],
    queryFn: () => getPayload(),
  })
  const isInitialized = ref(false)
  watch([flowData, activeNodeId], ([newFlowData, newActiveNodeId]) => {
    // Populate nodes and edges
    // Go through each node and see if there is a connection.
    if (isInitialized.value || !newFlowData) return

    const newNodes = []
    const newEdges = []
    // Nodes: Each of the flow data item
    // Edges: Form a map, since the flow array order can be random. Edges are bidirectional, shouldnt be dupes.
    // Map structure { sourceId: {targetId, connectorIds[]}[] }
    const edgeMap = new Map()
    newFlowData.forEach((node, _idx, data) => {
      if (!isConnector(node)) {
        newNodes.push({
          id: String(node.id),
          position: { x: 0, y: 0 },
          type: node.type,
          data: {
            ...node.data,
            ...(node.name && { name: node.name }),
          },
          selected: String(newActiveNodeId) === String(node.id),
        })

        // Check if current node has parent (means has relationship/connection)
        let [parentId, nodeId] = [String(node.parentId), String(node.id)]
        if (parentId && parentId !== '-1') {
          // Check if parent node is a connector node, if true traverse until real node (non-connector)
          const nearestNode = findNearestNode(nodeId, data)
          const connectorIds = nearestNode.connectors.map((cn) => String(cn.id))
          parentId = String(nearestNode.node.id)
          if (!edgeMap.has(parentId)) {
            edgeMap.set(parentId, [
              {
                targetId: nodeId,
                connectorIds,
              },
            ])
          } else {
            const arr = edgeMap.get(parentId) || []
            arr.push({
              targetId: nodeId,
              connectorIds,
            })
            // Update array
            edgeMap.set(parentId, arr)
          }
        }
      }
    })

    // Edges map's populated, convert into VueFlow edges
    edgeMap.forEach((targetObj, sourceId) => {
      for (const { targetId, connectorIds } of targetObj) {
        // Only support one connector in between nodes
        const connectorId = connectorIds?.length ? connectorIds[0] : null
        const connector = newFlowData.find((dt) => dt.id === connectorId)
        newEdges.push({
          id: `${sourceId}->${targetId}`,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
          data: {
            ...(connector && { connectorType: connector.data.connectorType }),
          },
          ...(connector && {
            label: connector.name,
            labelBgPadding: [8, 4],
            labelBgBorderRadius: 4,
          }),
        })
      }
    })

    nodes.value = newNodes
    edges.value = newEdges
    // Reset the history for undo, redo control
    nodesHistory.clear()
    edgesHistory.clear()

    isInitialized.value = true
  })

  const { mutate: reconcilePayload } = useMutation({
    mutationFn: async (val) => updatePayload(val),
  })
  // TODO: Watch changes to nodes/edges and update static memory
  return {
    nodes,
    edges,
    nodesHistory,
    edgesHistory,
  }
})

const isConnector = (node) => node.type.endsWith('Connector')

const findNearestNode = (fromId, items, connectors = [], direction = 'upstream') => {
  const currentNode = items.find((item) => String(item.id) === String(fromId))
  if (!currentNode) return null

  // Check for parentId
  const parentNode = items.find((item) => String(item.id) === String(currentNode.parentId)) || null
  if (!parentNode) return null

  // Parent exists, check if its a node or connector
  if (isConnector(parentNode)) {
    connectors.push(parentNode)
    // Repeat process
    return findNearestNode(parentNode.id, items, connectors, direction)
  }

  return {
    node: parentNode,
    connectors,
  }
}
