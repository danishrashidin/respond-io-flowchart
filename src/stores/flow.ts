import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRefHistory } from '@vueuse/core'
import type { Node, Edge } from '@vue-flow/core'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { get as getPayload, post as updatePayload } from '@/lib/api/payload'
import type { CustomData, CustomType } from '@/lib/node'

export const useFlowStore = defineStore('flow', () => {
  const nodes = ref<Node<CustomData, any, CustomType>[]>([])
  const nodesHistory = useRefHistory(nodes, {
    deep: true,
  })
  const edges = ref<Edge[]>([])
  const edgesHistory = useRefHistory(edges, {
    deep: true,
  })

  const { data: flowData } = useQuery({
    queryKey: ['flow'],
    queryFn: () => getPayload(),
  })
  watch(flowData, (newFlowData) => {
    // Populate nodes and edges
    // Go through each node and see if there is a connection.

    if (!newFlowData) return
    nodes.value = []
    edges.value = []
    // Nodes: Each of the flow data item
    // Edges: Form a map, since the flow array order can be random. Edges are bidirectional, shouldnt be dupes.
    // Map structure { sourceId: targetId[] }
    const edgeMap = new Map<string, string[]>()

    newFlowData.forEach((node) => {
      nodes.value.push({
        id: String(node.id),
        position: { x: 0, y: 0 },
        type: node.type as CustomType,
        data: {
          ...node.data,
          ...(node.name && { name: node.name }),
        } as CustomData,
      })

      // Check if current node has parent (means has relationship/connection)
      const [parentId, nodeId] = [String(node.parentId), String(node.id)]
      if (parentId && parentId !== '-1') {
        if (!edgeMap.has(parentId)) {
          edgeMap.set(parentId, [nodeId])
        } else {
          const arr = edgeMap.get(parentId) || []
          arr.push(nodeId)
          // Update array
          edgeMap.set(parentId, arr)
        }
      }

      // Edges map's populated, convert into VueFlow edges
      edgeMap.forEach((targetIds, sourceId) => {
        for (const targetId of targetIds) {
          edges.value.push({
            id: `${sourceId}->${targetId}`,
            source: sourceId,
            target: targetId,
            type: 'smoothstep',
          })
        }
      })
    })
    nodesHistory.clear()
    edgesHistory.clear()
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
