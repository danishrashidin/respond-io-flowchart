import { computed, nextTick, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useManualRefHistory } from '@vueuse/core'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { get as getPayload, post as updatePayload } from '@/lib/api/payload'
import { useRouteParams } from '@vueuse/router'
import { useVueFlow } from '@vue-flow/core'

export const useFlowStore = defineStore('flow', () => {
  const activeNodeId = useRouteParams('nodeId')
  const vueFlow = useVueFlow()
  const nodes = computed({ get: () => vueFlow.nodes.value, set: vueFlow.setNodes })
  const edges = computed({
    get: () => vueFlow.edges.value,
    set: (items) => {
      const connectors = new Map()
      for (const edge of items) {
        const connector = edge.data?.connector
        if (!connector) continue
        const id = String(connector.id)
        if (!connectors.has(id)) connectors.set(id, connector)
        edge.data.connector = connectors.get(id)
      }
      vueFlow.setEdges(items)
    },
  })
  const snapshot = () => {
    const { nodes, edges } = vueFlow.toObject()
    return { nodes, edges }
  }
  const graph = ref(snapshot())
  const graphHistory = useManualRefHistory(graph, { clone: true })
  // VueFlow owns live changes; only completed node actions enter history.
  const layoutPending = ref(true)
  const createdNodeIds = new Set()

  const syncCreatedNodes = () => {
    if (!createdNodeIds.size) return
    const added = snapshot().nodes.filter((node) => createdNodeIds.has(node.id))
    for (const record of [
      graphHistory.last.value,
      ...graphHistory.undoStack.value,
      ...graphHistory.redoStack.value,
    ]) {
      record.snapshot.nodes.push(...structuredClone(added))
    }
    createdNodeIds.clear()
  }

  const beginHistory = (before) => {
    syncCreatedNodes()
    const current = before || snapshot()
    graph.value = current
    graphHistory.last.value.snapshot = current
  }

  const commitHistory = async () => {
    await nextTick()
    graph.value = snapshot()
    if (JSON.stringify(graph.value) === JSON.stringify(graphHistory.last.value.snapshot)) return
    graphHistory.commit()
  }

  const restoreHistory = (direction) => {
    if (!graphHistory[direction === 'undo' ? 'canUndo' : 'canRedo'].value) return
    syncCreatedNodes()
    layoutPending.value = false
    graphHistory[direction]()
    nodes.value = graph.value.nodes
    edges.value = graph.value.edges
    // Selection follows the current drawer route, not an old snapshot.
    nodes.value.forEach((node) => {
      node.selected = String(node.id) === String(activeNodeId.value)
    })
  }

  const addNode = (node) => {
    vueFlow.addNodes(node)
    createdNodeIds.add(node.id)
    layoutPending.value = true
  }

  const deleteNodes = (ids, before) => {
    beginHistory(before)
    const removed = new Set(ids.map(String))
    nodes.value = nodes.value.filter((node) => !removed.has(String(node.id)))
    edges.value = edges.value.filter(
      (edge) => !removed.has(String(edge.source)) && !removed.has(String(edge.target)),
    )
    layoutPending.value = true
    return commitHistory()
  }

  const { data: flowData } = useQuery({
    queryKey: ['flow'],
    queryFn: () => getPayload(),
  })
  const savedRecords = new Map()
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
      savedRecords.set(String(node.id), JSON.parse(JSON.stringify(node)))
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
        const connector = newFlowData.find((node) => String(node.id) === connectorId)
        newEdges.push({
          id: `${sourceId}->${targetId}`,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
          data: {
            ...(connector && { connector: savedRecords.get(connectorId) }),
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
    beginHistory()
    graphHistory.clear()

    isInitialized.value = true
  })

  const { mutate: reconcilePayload } = useMutation({
    mutationFn: async () => {
      const current = snapshot()
      const records = new Map(
        current.nodes.map((node) => {
          const { name, ...data } = node.data
          const id = savedRecords.get(String(node.id))?.id ?? node.id
          return [String(id), { id, parentId: -1, type: node.type, name, data }]
        }),
      )

      // Keep empty branches for surviving sources, including records needed by undo.
      const connectors = new Map(
        [...savedRecords.values()]
          .filter(
            (node) =>
              node.type === 'dateTimeConnector' &&
              records.get(String(node.parentId))?.type === 'dateTime',
          )
          .map((node) => [String(node.id), node]),
      )

      const connectedTargets = new Set()
      for (const edge of current.edges) {
        const source = records.get(String(edge.source))
        const target = records.get(String(edge.target))
        if (!source || !target || isConnector(source) || isConnector(target)) {
          throw new Error(`Edge ${edge.id} references a missing graph node`)
        }
        if (connectedTargets.has(String(target.id))) {
          throw new Error(`Node ${target.id} has multiple parents`)
        }
        connectedTargets.add(String(target.id))
        target.parentId = source.id

        let connector = edge.data?.connector
        const connectorType = connector?.data.connectorType ?? edge.data?.connectorType
        if (!connectorType) continue
        if (source.type !== 'dateTime') {
          throw new Error(`Edge ${edge.id} requires a business-hours source`)
        }
        connector ??= [...connectors.values()].find(
          (node) =>
            String(node.parentId) === String(source.id) &&
            node.data.connectorType === connectorType,
        )
        if (!connector) {
          connector = {
            id: crypto.randomUUID(),
            parentId: source.id,
            type: 'dateTimeConnector',
            data: { connectorType },
          }
        }
        connectors.set(String(connector.id), {
          ...connector,
          parentId: source.id,
          ...(typeof edge.label === 'string' && { name: edge.label }),
        })
        target.parentId = connector.id
      }

      for (const source of records.values()) {
        if (source.type !== 'dateTime') continue
        const connectorIds = [...connectors.values()]
          .filter((node) => String(node.parentId) === String(source.id))
          .map((node) => node.id)
        if (connectorIds.length || source.data.connectors) source.data.connectors = connectorIds
      }

      // Detach nested configuration from Vue proxies and future unsaved edits.
      const payload = JSON.parse(JSON.stringify([...records.values(), ...connectors.values()]))
      const result = updatePayload(payload)
      payload.forEach((node) => savedRecords.set(String(node.id), node))
      return result
    },
  })

  watch(
    () =>
      isInitialized.value
        ? JSON.stringify({
            nodes: nodes.value.map(({ id, type, data }) => ({ id, type, data })),
            edges: edges.value.map(({ source, target, data, label }) => ({
              source,
              target,
              connector: data?.connector,
              connectorType: data?.connectorType,
              ...(typeof label === 'string' && { label }),
            })),
          })
        : null,
    (_, previous) => {
      // Establish the loaded graph as the baseline before saving user edits.
      if (previous !== null) reconcilePayload()
    },
    { flush: 'post' },
  )

  return {
    nodes,
    edges,
    vueFlowId: vueFlow.id,
    graphHistory,
    snapshot,
    canUndo: graphHistory.canUndo,
    canRedo: graphHistory.canRedo,
    beginHistory,
    commitHistory,
    undo: () => restoreHistory('undo'),
    redo: () => restoreHistory('redo'),
    addNode,
    deleteNodes,
    layoutPending,
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
