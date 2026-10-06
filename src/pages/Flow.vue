<template>
  <SidebarProvider :open="isNodeAction || !!activeNodeId">
    <div class="relative" style="height: 100svh; width: 100svw">
      <div class="absolute bottom-2 left-2 z-50">
        <Button variant="default" @click="router.push('/nodes/new')">
          <Plus class="h-5" />
          Create New Node
        </Button>
      </div>
      <VueFlow
        v-model:nodes="flow.nodes"
        v-model:edges="flow.edges"
        :select-nodes-on-drag="false"
        @nodes-initialized="repositionNodes"
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
import { Plus } from '@lucide/vue'

const flow = useFlowStore()
const { fitView, updateNode } = useVueFlow()
const { layout } = useLayout()
const router = useRouter()
const route = useRoute()

const isNodeAction = computed(() => route.path.startsWith('/nodes'))
const activeNodeId = useRouteParams('nodeId')

const repositionNodes = () => {
  flow.nodes = layout(flow.nodes, flow.edges)
  nextTick(() => {
    fitView()
  })
}

watch(
  [activeNodeId, () => flow.nodes],
  ([newActiveNodeId, newNodes], [oldActiveNodeId, oldNodes]) => {
    if (newActiveNodeId === oldActiveNodeId) {
      // Selection changes update route
      const selectionNodeId = newNodes.find((node) => !!node.selected)?.id
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
  {
    deep: true,
  },
)

watch(
  () => route.path,
  (path) => {
    console.log(path)
  },
)
</script>
