<template>
  <SidebarProvider :open="isNodeAction || !!activeNodeId">
    <div class="relative" style="height: 100svh; width: 100svw">
      <div class="absolute bottom-2 left-2 z-50 flex flex-wrap items-center gap-2">
        <Button variant="default" @click="router.push('/nodes/new')">
          <Plus class="h-5" />
          Create New Node
        </Button>
        <Button variant="secondary" :disabled="!flow.canUndo" @click="flow.undo()">
          <Undo2 class="h-5" />
          Undo
        </Button>
        <Button variant="secondary" :disabled="!flow.canRedo" @click="flow.redo()">
          <Redo2 class="h-5" />
          Redo
        </Button>
      </div>
      <VueFlow
        :id="flow.vueFlowId"
        :select-nodes-on-drag="false"
        @nodes-initialized="repositionNodes"
        @nodes-change="handleNodesChange"
        @edges-change="handleEdgesChange"
        @node-drag-start="flow.beginHistory()"
        @node-drag-stop="flow.commitHistory()"
        @selection-drag-start="flow.beginHistory()"
        @selection-drag-stop="flow.commitHistory()"
      >
        <Background />

        <template #node-trigger="triggerNodeProps">
          <TriggerNode v-bind="triggerNodeProps" />
        </template>

        <template #node-dateTime="dateTimeNodeProps">
          <BusinessHoursNode v-bind="dateTimeNodeProps" />
        </template>

        <template #node-sendMessage="sendMessageNodeProps">
          <SendMessageNode v-bind="sendMessageNodeProps" />
        </template>

        <template #node-addComment="addCommentNodeProps">
          <AddCommentNode v-bind="addCommentNodeProps" />
        </template>
      </VueFlow>
      <Sidebar
        side="right"
        variant="floating"
        collapsible="offcanvas"
        style="--sidebar-width: 384px"
      >
        <SidebarContent class="p-4 overflow-y-auto">
          <RouterView />
        </SidebarContent>
      </Sidebar>
    </div>
  </SidebarProvider>
</template>

<script setup>
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { useFlowStore } from '@/stores/flow'
import { computed, nextTick, watch } from 'vue'
import TriggerNode from '@/components/node/custom/TriggerNode.vue'
import BusinessHoursNode from '@/components/node/custom/BusinessHoursNode.vue'
import SendMessageNode from '@/components/node/custom/SendMessageNode.vue'
import AddCommentNode from '@/components/node/custom/AddCommentNode.vue'
import { useLayout } from '@/composables/useLayout'
import { SidebarProvider, SidebarContent, Sidebar } from '@/components/ui/sidebar'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { useRouteParams } from '@vueuse/router'
import { Plus, Undo2, Redo2 } from '@lucide/vue'

const flow = useFlowStore()
const { fitView, updateNode } = useVueFlow(flow.vueFlowId)
const { layout } = useLayout()
const router = useRouter()
const route = useRoute()

const isNodeAction = computed(() => route.path.startsWith('/nodes'))
const activeNodeId = useRouteParams('nodeId')

let removalSnapshot
const handleEdgesChange = (changes) => {
  // VueFlow removes connected edges before emitting node removals.
  if (removalSnapshot || !changes.some((change) => change.type === 'remove')) return
  removalSnapshot = flow.snapshot()
  nextTick(() => {
    removalSnapshot = undefined
  })
}

const handleNodesChange = (changes) => {
  const removedIds = changes.filter((change) => change.type === 'remove').map((change) => change.id)
  if (removedIds.length) flow.deleteNodes(removedIds, removalSnapshot)
  // Keyboard moves provide a position with dragging=false; drag-stop does not.
  else if (
    changes.some((change) => change.type === 'position' && !change.dragging && change.position)
  ) {
    flow.beginHistory()
    flow.commitHistory()
  }
}

const repositionNodes = () => {
  if (!flow.nodes.length || !flow.layoutPending) return
  flow.nodes = layout(flow.nodes, flow.edges)
  flow.layoutPending = false
  nextTick(() => {
    fitView()
  })
}

watch(
  [activeNodeId, () => flow.nodes.find((node) => !!node.selected)?.id],
  ([newActiveNodeId, selectionNodeId], [oldActiveNodeId]) => {
    if (newActiveNodeId === oldActiveNodeId) {
      // Selection changes update route
      if (selectionNodeId) {
        router.push(`/nodes/${selectionNodeId}`)
      } else {
        router.push('/')
      }
    } else {
      if (!!newActiveNodeId) {
        // Route change updates node state
        updateNode(newActiveNodeId, {
          selected: true,
        })
      }
      if (!!oldActiveNodeId) {
        // Route change updates node state
        updateNode(oldActiveNodeId, {
          selected: false,
        })
      }
    }
  },
)

watch(
  () => route.path,
  (path) => {
    console.log(path)
  },
)
</script>
