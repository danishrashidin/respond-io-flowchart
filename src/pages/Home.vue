<template>
  <div style="height: 100svh; width: 100svw">
    <VueFlow
      v-model:nodes="flow.nodes"
      v-model:edges="flow.edges"
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

      <template #node-dateTimeConnector="dtConnectorNodeProps">
        <DtConnectorNode v-bind="dtConnectorNodeProps" />
      </template>
    </VueFlow>
  </div>
  <RouterView />
</template>

<script setup lang="ts">
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { useFlowStore } from '@/stores/flow'
import { nextTick, watchEffect } from 'vue'
import TriggerNode from '@/components/node/custom/TriggerNode.vue'
import BusinessHoursNode from '@/components/node/custom/BusinessHoursNode.vue'
import SendMessageNode from '@/components/node/custom/SendMessageNode.vue'
import AddCommentNode from '@/components/node/custom/AddCommentNode.vue'
import DtConnectorNode from '@/components/node/custom/DtConnectorNode.vue'
import { useLayout } from '@/composables/useLayout'

const flow = useFlowStore()
const { fitView } = useVueFlow()
const { layout } = useLayout()

const repositionNodes = () => {
  flow.nodes = layout(flow.nodes, flow.edges)
  nextTick(() => {
    fitView()
  })
}

watchEffect(() => {
  console.log(flow.nodes)
})
</script>
