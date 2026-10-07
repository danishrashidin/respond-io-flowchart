import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { useFlowStore } from '@/stores/flow'
import { get, post } from '@/lib/api/payload'
import payload from '@/lib/payload.json'

const mutation = vi.hoisted(() => ({ save: undefined }))

// Capture the private mutation while retaining Vue Query's real execution path.
vi.mock('@tanstack/vue-query', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useMutation: (...args) => {
      const result = actual.useMutation(...args)
      mutation.save = result.mutateAsync
      return result
    },
  }
})

let queryClient
beforeEach(() => post(structuredClone(payload)))
afterEach(() => {
  queryClient?.clear()
  post(structuredClone(payload))
})

async function openFlow() {
  const pinia = createPinia()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  })
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await router.push('/')
  mount(
    {
      setup() {
        useFlowStore()
        return {}
      },
      template: '<div />',
    },
    { global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] } },
  )
  await flushPromises()
  const flow = useFlowStore(pinia)
  // Fetched nested data is readonly; give edits independent configuration objects.
  flow.nodes.forEach((node) => {
    node.data = JSON.parse(JSON.stringify(node.data))
  })
  return flow
}

const recordsById = (records) => Object.fromEntries(records.map((record) => [record.id, record]))

describe('automatic flow payload mutation', () => {
  it('does not replace storage during graph initialization', async () => {
    const previous = get()
    await openFlow()
    await flushPromises()
    expect(get()).toBe(previous)
  })

  it('automatically saves nested node configuration edits', async () => {
    const flow = await openFlow()
    const node = flow.nodes.find((node) => node.id === 'b0653a')
    node.data.name = 'Updated title'
    node.data.payload[0].text = 'Saved automatically'
    await flushPromises()
    expect(get().find((record) => record.id === 'b0653a')).toMatchObject({
      name: 'Updated title',
      data: { payload: [{ type: 'text', text: 'Saved automatically' }, expect.any(Object)] },
    })
  })

  it('automatically saves new nodes and connections together', async () => {
    const flow = await openFlow()
    flow.addNode({
      id: 'new-comment',
      type: 'addComment',
      position: { x: 0, y: 0 },
      data: { name: 'New comment', comment: 'New note' },
    })
    flow.edges = [...flow.edges, { id: 'new-edge', source: '1', target: 'new-comment' }]
    await flushPromises()
    expect(get().find((record) => record.id === 'new-comment')).toEqual({
      id: 'new-comment',
      parentId: 1,
      type: 'addComment',
      name: 'New comment',
      data: { comment: 'New note' },
    })
  })

  it('automatically saves branch changes and disconnections', async () => {
    const flow = await openFlow()
    flow.edges.find((edge) => edge.target === 'b0653a').label = 'Updated success'
    flow.edges = flow.edges.filter((edge) => edge.target !== 'b6a0c1')
    await flushPromises()
    expect(get().find((record) => record.id === '161f52').name).toBe('Updated success')
    expect(get().find((record) => record.id === 'b6a0c1').parentId).toBe(-1)
  })

  it('automatically saves deletion, undo and redo', async () => {
    const flow = await openFlow()
    await flow.deleteNodes(['e879e4'])
    await flushPromises()
    expect(get().some((record) => record.id === 'e879e4')).toBe(false)
    flow.undo()
    await flushPromises()
    expect(get().find((record) => record.id === 'e879e4')).toEqual(
      payload.find((record) => record.id === 'e879e4'),
    )
    flow.redo()
    await flushPromises()
    expect(get().some((record) => record.id === 'e879e4')).toBe(false)
  })

  it('preserves connector identities when undo restores a deleted branch source', async () => {
    const flow = await openFlow()
    await flow.deleteNodes(['d09c08'])
    await flushPromises()
    expect(get().some((record) => record.type === 'dateTimeConnector')).toBe(false)
    flow.undo()
    await flushPromises()
    expect(recordsById(get())).toEqual(recordsById(payload))
  })

  it('retains an edited empty branch when its deleted source is restored', async () => {
    const flow = await openFlow()
    flow.edges.find((edge) => edge.target === 'b0653a').label = 'Updated success'
    await flushPromises()
    flow.edges = flow.edges.filter((edge) => edge.target !== 'b0653a')
    await flushPromises()
    const connector = get().find((record) => record.id === '161f52')
    await flow.deleteNodes(['d09c08'])
    await flushPromises()
    flow.undo()
    await flushPromises()
    expect(get().find((record) => record.id === '161f52')).toEqual(connector)
  })

  it('retains a newly created empty branch when its deleted source is restored', async () => {
    const flow = await openFlow()
    flow.addNode({
      id: 'new-hours',
      type: 'dateTime',
      position: { x: 0, y: 0 },
      data: { times: [], connectors: [] },
    })
    flow.edges = [
      ...flow.edges,
      {
        id: 'new-branch',
        source: 'new-hours',
        target: '1',
        label: 'New success',
        data: { connectorType: 'success' },
      },
    ]
    await flushPromises()
    const connector = get().find((record) => record.parentId === 'new-hours')
    expect(connector).toMatchObject({ name: 'New success', type: 'dateTimeConnector' })
    flow.edges = flow.edges.filter((edge) => edge.id !== 'new-branch')
    await flushPromises()
    await flow.deleteNodes(['new-hours'])
    await flushPromises()
    flow.undo()
    await flushPromises()
    expect(get().find((record) => record.id === connector.id)).toEqual(connector)
  })

  it('ignores selection, node positions and edge presentation changes', async () => {
    const flow = await openFlow()
    await flushPromises()
    const previous = get()
    flow.nodes[0].selected = true
    flow.nodes[0].position = { x: 500, y: 250 }
    flow.edges[0].selected = true
    flow.edges[0].style = { stroke: 'red' }
    await flushPromises()
    expect(get()).toBe(previous)
  })
})

describe('flow payload mutation', () => {
  it('keeps complete connector records in edge data and saves nested metadata edits', async () => {
    const flow = await openFlow()
    const edge = flow.edges.find((edge) => edge.target === 'b0653a')
    expect(edge.data.connector).toEqual(payload.find((record) => record.id === '161f52'))
    edge.data.connector.data.condition = { channel: 'email' }
    await flushPromises()
    expect(get().find((record) => record.id === '161f52').data.condition).toEqual({
      channel: 'email',
    })
    edge.data.connector.data.condition.channel = 'chat'
    expect(get().find((record) => record.id === '161f52').data.condition.channel).toBe('email')
  })

  it('shares connector metadata across sibling edges, including after undo', async () => {
    const sharedPayload = structuredClone(payload)
    sharedPayload.find((record) => record.id === 'e879e4').parentId = '161f52'
    sharedPayload.find((record) => record.id === '161f52').data.condition = { channel: 'chat' }
    post(sharedPayload)
    const flow = await openFlow()
    flow.edges.find((edge) => edge.target === 'b0653a').data.connector.data.condition.channel =
      'email'
    await flushPromises()
    expect(get().find((record) => record.id === '161f52').data.condition.channel).toBe('email')
    expect(
      flow.edges.find((edge) => edge.target === 'e879e4').data.connector.data.condition.channel,
    ).toBe('email')
    await flow.deleteNodes(['e879e4'])
    await flushPromises()
    flow.undo()
    await flushPromises()
    flow.edges.find((edge) => edge.target === 'b0653a').data.connector.data.condition.channel =
      'web'
    await flushPromises()
    expect(get().find((record) => record.id === '161f52').data.condition.channel).toBe('web')
  })

  it('loads and reconverts numeric connector IDs without losing branch metadata', async () => {
    const numericPayload = structuredClone(payload)
    numericPayload.find((record) => record.id === '161f52').id = 42
    numericPayload.find((record) => record.id === 'd09c08').data.connectors[0] = 42
    numericPayload.find((record) => record.id === 'b0653a').parentId = 42
    post(numericPayload)
    const flow = await openFlow()
    expect(flow.edges.find((edge) => edge.target === 'b0653a').data.connector).toEqual({
      id: 42,
      parentId: 'd09c08',
      type: 'dateTimeConnector',
      name: 'Success',
      data: { connectorType: 'success' },
    })
    await mutation.save()
    expect(recordsById(get())).toEqual(recordsById(numericPayload))
  })

  it('round trips the loaded graph including connector records and numeric IDs', async () => {
    await openFlow()
    await mutation.save()
    expect(recordsById(get())).toEqual(recordsById(payload))
  })

  it('saves live node configuration without VueFlow presentation fields', async () => {
    const flow = await openFlow()
    const node = flow.nodes.find((node) => node.id === 'b0653a')
    node.data.name = ''
    node.data.description = 'Updated description'
    node.data.payload[0].text = 'Updated welcome'
    node.position = { x: 50, y: 100 }
    node.selected = true
    await mutation.save()
    expect(get().find((record) => record.id === 'b0653a')).toEqual({
      id: 'b0653a',
      parentId: '161f52',
      type: 'sendMessage',
      name: '',
      data: {
        description: 'Updated description',
        payload: [
          { type: 'text', text: 'Updated welcome' },
          {
            type: 'attachment',
            attachment: payload.find((record) => record.id === 'b0653a').data.payload[1].attachment,
          },
        ],
      },
    })
  })

  it('adds connected and disconnected nodes using current edges', async () => {
    const flow = await openFlow()
    flow.addNode({
      id: 'new-comment',
      type: 'addComment',
      position: { x: 0, y: 0 },
      data: { name: 'New comment', comment: 'New note' },
    })
    flow.addNode({
      id: 'new-hours',
      type: 'dateTime',
      position: { x: 0, y: 0 },
      data: { name: 'New hours', times: [], timezone: 'UTC' },
    })
    flow.edges = [...flow.edges, { id: 'new-edge', source: '1', target: 'new-comment' }]
    await mutation.save()
    expect(get().find((record) => record.id === 'new-comment')).toEqual({
      id: 'new-comment',
      parentId: 1,
      type: 'addComment',
      name: 'New comment',
      data: { comment: 'New note' },
    })
    expect(get().find((record) => record.id === 'new-hours')).toEqual({
      id: 'new-hours',
      parentId: -1,
      type: 'dateTime',
      name: 'New hours',
      data: { times: [], timezone: 'UTC' },
    })
  })

  it('removes deleted nodes while retaining empty branches of a surviving source', async () => {
    const flow = await openFlow()
    await flow.deleteNodes(['b0653a'])
    await mutation.save()
    expect(get().some((record) => record.id === 'b0653a')).toBe(false)
    expect(get().find((record) => record.id === '161f52')).toEqual(
      payload.find((record) => record.id === '161f52'),
    )
    expect(get().find((record) => record.id === 'd09c08').data.connectors).toEqual([
      '161f52',
      '28c4b9',
    ])
  })

  it('removes a deleted source and its connectors, making surviving children roots', async () => {
    const flow = await openFlow()
    await flow.deleteNodes(['d09c08'])
    await mutation.save()
    expect(get().map((record) => record.id)).not.toContain('d09c08')
    expect(get().some((record) => record.type === 'dateTimeConnector')).toBe(false)
    expect(get().find((record) => record.id === 'b0653a').parentId).toBe(-1)
    expect(get().find((record) => record.id === 'b6a0c1').parentId).toBe(-1)
  })

  it('reconstructs changed branch relationships while preserving connector IDs', async () => {
    const flow = await openFlow()
    const edge = flow.edges.find((edge) => edge.target === 'b6a0c1')
    const otherEdge = flow.edges.find((edge) => edge.target === 'b0653a')
    const success = otherEdge.data.connector
    otherEdge.data.connector = edge.data.connector
    edge.data.connector = success
    edge.label = 'Success renamed'
    otherEdge.label = 'Failure'
    await mutation.save()
    expect(get().find((record) => record.id === 'b6a0c1').parentId).toBe('161f52')
    expect(get().find((record) => record.id === 'b0653a').parentId).toBe('28c4b9')
    expect(get().find((record) => record.id === '161f52').name).toBe('Success renamed')
    expect(get().find((record) => record.id === '28c4b9')).toEqual(
      payload.find((record) => record.id === '28c4b9'),
    )
  })

  it.each([{ connectors: undefined }, { connectors: [] }])(
    'keeps new branch IDs stable with live connectors %j',
    async ({ connectors }) => {
      const flow = await openFlow()
      flow.nodes = [
        {
          id: 'hours',
          type: 'dateTime',
          position: { x: 0, y: 0 },
          data: { times: [], ...(connectors !== undefined && { connectors }) },
        },
        {
          id: 'hours-success',
          type: 'addComment',
          position: { x: 0, y: 0 },
          data: { comment: 'OK' },
        },
      ]
      flow.edges = [
        {
          id: 'new-branch',
          source: 'hours',
          target: 'hours-success',
          label: 'Success',
          data: { connectorType: 'success' },
        },
      ]
      await mutation.save()
      const connector = get().find((record) => record.type === 'dateTimeConnector')
      expect(connector).toEqual({
        id: expect.any(String),
        parentId: 'hours',
        type: 'dateTimeConnector',
        name: 'Success',
        data: { connectorType: 'success' },
      })
      expect(connector.id).not.toBe('hours-success')
      expect(get().find((record) => record.id === 'hours').data.connectors).toEqual([connector.id])
      expect(get().find((record) => record.id === 'hours-success').parentId).toBe(connector.id)
      await mutation.save()
      expect(get().filter((record) => record.type === 'dateTimeConnector')).toEqual([connector])
      flow.edges = []
      await mutation.save()
      expect(get().filter((record) => record.type === 'dateTimeConnector')).toEqual([connector])
      expect(get().find((record) => record.id === 'hours').data.connectors).toEqual([connector.id])
      expect(get().find((record) => record.id === 'hours-success').parentId).toBe(-1)
    },
  )

  it('detaches saved nested configuration from later live edits', async () => {
    const flow = await openFlow()
    await mutation.save()
    flow.nodes.find((node) => node.id === 'b0653a').data.payload[0].text = 'Unsaved edit'
    flow.nodes.find((node) => node.id === 'd09c08').data.times[0].startTime = '10:00'
    expect(get().find((record) => record.id === 'b0653a').data.payload[0].text).toBe(
      'Hello there\n\nwelcome to the chat!',
    )
    expect(get().find((record) => record.id === 'd09c08').data.times[0].startTime).toBe('09:00')
  })

  it.each([
    [{ id: 'missing-source', source: 'missing', target: 'b0653a' }],
    [{ id: 'missing-target', source: '1', target: 'missing' }],
    [
      { id: 'first-parent', source: '1', target: 'b0653a' },
      { id: 'second-parent', source: 'b6a0c1', target: 'b0653a' },
    ],
  ])('rejects unrepresentable edges without replacing storage: %j', async (...edges) => {
    const flow = await openFlow()
    // Mutate VueFlow's edge ref directly so it cannot discard invalid endpoints.
    flow.edges.splice(0, flow.edges.length, ...edges)
    const previous = get()
    await expect(mutation.save()).rejects.toThrow()
    expect(get()).toBe(previous)
    expect(get()).toEqual(payload)
  })

  it('replaces storage with an empty array when the current graph is empty', async () => {
    const flow = await openFlow()
    flow.edges = []
    flow.nodes = []
    await mutation.save()
    expect(get()).toEqual([])
  })
})
