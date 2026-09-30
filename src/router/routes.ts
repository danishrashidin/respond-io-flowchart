import NodeDetails from '@/components/node/NodeDetails.vue'
import NodeNew from '@/components/node/NodeNew.vue'
import Home from '@/pages/Home.vue'
import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    name: 'Home',
    path: '',
    component: Home,
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
