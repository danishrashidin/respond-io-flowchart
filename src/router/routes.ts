import NodeDetails from '@/components/node/NodeDetails.vue'
import NodeNew from '@/components/forms/CreateNewNode.vue'
import Flow from '@/pages/Flow.vue'
import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    name: 'Home',
    path: '',
    component: Flow,
    children: [
      {
        name: 'Node Details',
        path: 'nodes/:nodeId',
        component: NodeDetails,
      },
      {
        name: 'Create new Node',
        path: 'nodes/new',
        component: NodeNew,
      },
    ],
  },
]
