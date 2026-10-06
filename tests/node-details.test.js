import { afterEach, describe, expect, it, vi } from 'vitest'
import { DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import NodeDetails from '@/components/node/NodeDetails.vue'
import { useFlowStore } from '@/stores/flow'
import Flow from '@/pages/Flow.vue'
import TriggerNode from '@/components/node/custom/TriggerNode.vue'
import CreateNewNode from '@/components/forms/CreateNewNode.vue'
import { VueFlow } from '@vue-flow/core'

afterEach(() => vi.unstubAllGlobals())

function makeNode(type = 'addComment', data = {}) {
  return {
    id: 'one',
    type,
    position: { x: 10, y: 20 },
    selected: true,
    data: { name: 'Original title', description: 'Original description', comment: 'Note', ...data },
  }
}

async function openDetails(nodes = [makeNode()], withFlow = false, component = NodeDetails) {
  if (withFlow) {
    vi.stubGlobal(
      'DOMMatrixReadOnly',
      class {
        m22 = 1
      },
    )
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
  }
  const pinia = createPinia()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: withFlow
      ? [
          {
            path: '/',
            component: Flow,
            children: [{ path: 'nodes/:nodeId', component: NodeDetails }],
          },
        ]
      : [
          { path: '/', component: { template: '<div />' } },
          { path: '/nodes/:nodeId', component: NodeDetails },
        ],
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
  await router.push('/nodes/one')
  const wrapper = mount(withFlow ? RouterView : component, {
    attachTo: document.body,
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
  })
  const flow = useFlowStore(pinia)
  await flushPromises()
  flow.edges = []
  flow.nodes = nodes
  await flushPromises()
  const click = async (text) => {
    const button = wrapper.findAll('button').find((button) => button.text() === text)
    expect(button, `Missing button: ${text}`).toBeDefined()
    await button.trigger('click')
    await flushPromises()
  }
  return { wrapper, flow, router, click }
}

describe('node details', () => {
  it('restores node configuration and edge styling from whole-graph snapshots', async () => {
    const { flow, click } = await openDetails([
      { ...makeNode(), draggable: false, style: { opacity: 0.75 } },
      { ...makeNode(), id: 'two', selected: false },
    ])
    flow.edges = [
      {
        id: 'one->two',
        source: 'one',
        target: 'two',
        style: { stroke: 'red' },
        label: 'Success',
        labelStyle: { fontWeight: 600 },
      },
    ]
    await click('Delete node')
    await click('Confirm deletion')
    flow.undo()
    await flushPromises()
    expect(flow.nodes.find((node) => node.id === 'one')).toMatchObject({
      draggable: false,
      style: { opacity: 0.75 },
    })
    expect(flow.edges[0]).toMatchObject({
      id: 'one->two',
      source: 'one',
      target: 'two',
      style: { stroke: 'red' },
      label: 'Success',
      labelStyle: { fontWeight: 600 },
    })
  })

  it('undoes and redoes a submitted edit from the toolbar without recording selection', async () => {
    const { wrapper, flow, router, click } = await openDetails([makeNode()], true)
    const undo = () => wrapper.findAll('button').find((button) => button.text() === 'Undo')
    const redo = () => wrapper.findAll('button').find((button) => button.text() === 'Redo')
    expect(undo(), 'Undo toolbar button').toBeDefined()
    expect(undo().element.disabled).toBe(true)
    expect(redo().element.disabled).toBe(true)
    await router.push('/')
    await router.push('/nodes/one')
    await flushPromises()
    expect(undo().element.disabled).toBe(true)
    await wrapper.get('#title').setValue('Edited title')
    await click('Submit')
    await click('Undo')
    expect(flow.nodes[0].data.name).toBe('Original title')
    expect(router.currentRoute.value.path).toBe('/')
    expect(undo().element.disabled).toBe(true)
    expect(redo().element.disabled).toBe(false)
    await click('Redo')
    expect(flow.nodes[0].data.name).toBe('Edited title')
    expect(redo().element.disabled).toBe(true)
  })

  it.each(['node', 'selection'])(
    'records one %s drag step, ignores unchanged drags and clears redo on a new move',
    async (target) => {
      const { wrapper, flow, click } = await openDetails([makeNode()], true)
      const canvas = wrapper.findComponent(VueFlow)
      const start = { ...flow.nodes[0].position }
      canvas.vm.$emit(`${target}DragStart`, { node: flow.nodes[0], nodes: flow.nodes })
      flow.nodes[0].position = { x: 300, y: 400 }
      await nextTick()
      flow.nodes[0].position = { x: 500, y: 600 }
      canvas.vm.$emit(`${target}DragStop`, { node: flow.nodes[0], nodes: flow.nodes })
      await flushPromises()
      await click('Undo')
      expect(flow.nodes[0].position).toEqual(start)
      expect(flow.canUndo).toBe(false)
      expect(flow.canRedo).toBe(true)
      canvas.vm.$emit(`${target}DragStart`, { node: flow.nodes[0], nodes: flow.nodes })
      canvas.vm.$emit(`${target}DragStop`, { node: flow.nodes[0], nodes: flow.nodes })
      await flushPromises()
      expect(flow.canUndo).toBe(false)
      expect(flow.canRedo).toBe(true)
      canvas.vm.$emit(`${target}DragStart`, { node: flow.nodes[0], nodes: flow.nodes })
      flow.nodes[0].position = { x: 700, y: 800 }
      canvas.vm.$emit(`${target}DragStop`, { node: flow.nodes[0], nodes: flow.nodes })
      await flushPromises()
      expect(flow.canRedo).toBe(false)
      await click('Undo')
      expect(flow.nodes[0].position).toEqual(start)
    },
  )

  it('restores a deleted node, its edges and positions together', async () => {
    const { flow, click } = await openDetails(
      [makeNode(), { ...makeNode(), id: 'two', selected: false }],
      true,
    )
    flow.edges = [
      { id: 'one->two', source: 'one', target: 'two', data: { connectorType: 'success' } },
    ]
    flow.nodes[0].position = { x: 123, y: 456 }
    flow.nodes[1].position = { x: 789, y: 987 }
    await flushPromises()
    await click('Delete node')
    await click('Confirm deletion')
    await click('Undo')
    expect(flow.nodes.map((node) => node.id)).toEqual(['one', 'two'])
    expect(flow.nodes.map((node) => node.position)).toEqual([
      { x: 123, y: 456 },
      { x: 789, y: 987 },
    ])
    expect(flow.edges).toHaveLength(1)
    expect(flow.edges[0]).toMatchObject({
      id: 'one->two',
      source: 'one',
      target: 'two',
      data: { connectorType: 'success' },
    })
    expect(flow.canUndo).toBe(false)
    await click('Redo')
    expect(flow.nodes.map((node) => node.id)).toEqual(['two'])
    expect(flow.edges).toHaveLength(0)
  })

  it('keeps created nodes through older undo and redo, while their deletion is undoable', async () => {
    const { wrapper, flow, router, click } = await openDetails([makeNode()], true)
    await wrapper.get('#title').setValue('Edited title')
    await click('Submit')
    await click('Undo')
    flow.addNode({ ...makeNode(), id: 'two', selected: false })
    await flushPromises()
    const createdPosition = { ...flow.nodes.find((node) => node.id === 'two').position }
    expect(flow.canUndo).toBe(false)
    expect(flow.canRedo).toBe(true)
    await click('Redo')
    expect(flow.nodes.map((node) => node.id)).toEqual(['one', 'two'])
    expect(flow.nodes[0].data.name).toBe('Edited title')
    await click('Undo')
    expect(flow.nodes.map((node) => node.id)).toEqual(['one', 'two'])
    expect(flow.nodes[1].position).toEqual(createdPosition)
    await router.push('/nodes/two')
    await flushPromises()
    await click('Delete node')
    await click('Confirm deletion')
    expect(flow.nodes.map((node) => node.id)).toEqual(['one'])
    await click('Undo')
    expect(flow.nodes.map((node) => node.id)).toEqual(['one', 'two'])
  })

  it('records canvas deletion as one step and restores the last node', async () => {
    const { wrapper, flow, click } = await openDetails([makeNode()], true)
    wrapper.findComponent(VueFlow).vm.removeNodes('one')
    await flushPromises()
    expect(flow.nodes).toHaveLength(0)
    expect(flow.canUndo).toBe(true)
    await click('Undo')
    expect(flow.nodes.map((node) => node.id)).toEqual(['one'])
    expect(flow.canUndo).toBe(false)
    await click('Redo')
    expect(flow.nodes).toHaveLength(0)
  })

  it('restores edges when multiple nodes are deleted through VueFlow', async () => {
    const { wrapper, flow, click } = await openDetails(
      [makeNode(), { ...makeNode(), id: 'two', selected: false }],
      true,
    )
    flow.edges = [{ id: 'one->two', source: 'one', target: 'two' }]
    await flushPromises()
    wrapper.findComponent(VueFlow).vm.removeNodes(['one', 'two'])
    await flushPromises()
    expect(flow.nodes).toHaveLength(0)
    expect(flow.edges).toHaveLength(0)
    await click('Undo')
    expect(flow.nodes.map((node) => node.id)).toEqual(['one', 'two'])
    expect(flow.edges).toHaveLength(1)
    expect(flow.edges[0]).toMatchObject({ id: 'one->two', source: 'one', target: 'two' })
    expect(flow.canUndo).toBe(false)
  })

  it('ignores an unchanged submitted edit', async () => {
    const { flow, click } = await openDetails([makeNode()], true)
    await click('Submit')
    expect(flow.canUndo).toBe(false)
  })

  it('undoes VueFlow keyboard moves and clears redo on a new keyboard move', async () => {
    const { wrapper, flow, click } = await openDetails([makeNode()], true)
    flow.nodes = [{ ...makeNode(), position: { x: 100, y: 100 } }]
    await flushPromises()
    await wrapper.get('.vue-flow__node[data-id="one"]').trigger('click')
    await flushPromises()
    expect(flow.nodes[0].selected).toBe(true)
    const start = { ...flow.nodes[0].position }
    await wrapper.get('.vue-flow__node[data-id="one"]').trigger('keydown', { key: 'ArrowRight' })
    await flushPromises()
    expect(flow.nodes[0].position).toEqual({ x: start.x + 5, y: start.y })
    expect(flow.canUndo).toBe(true)
    await click('Undo')
    expect(flow.nodes[0].position).toEqual(start)
    expect(flow.canUndo).toBe(false)
    expect(flow.canRedo).toBe(true)
    await wrapper.get('.vue-flow__node[data-id="one"]').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(flow.canRedo).toBe(false)
    await click('Undo')
    expect(flow.nodes[0].position).toEqual(start)
  })

  it.each([
    [
      { name: 'Renamed trigger', description: 'New trigger description' },
      'Renamed trigger',
      'New trigger description',
    ],
    [{}, 'Trigger', 'Conversation Opened'],
  ])(
    'renders trigger title and description with defaults for missing values',
    (data, title, description) => {
      const wrapper = mount(TriggerNode, { props: { data } })
      expect(wrapper.text()).toContain(title)
      expect(wrapper.text()).toContain(description)
    },
  )

  it('populates editable fields and displays the fixed node type and ID', async () => {
    const { wrapper } = await openDetails([
      makeNode('trigger', { type: 'conversationOpened', oncePerContact: false }),
    ])
    expect(wrapper.find('input#title').exists()).toBe(true)
    expect(wrapper.get('#title').element.value).toBe('Original title')
    expect(wrapper.get('#description').element.value).toBe('Original description')
    expect(wrapper.text()).toContain('Trigger')
    expect(wrapper.text()).toContain('Node IDone')
    expect(wrapper.find('input#type, select#type').exists()).toBe(false)
  })

  it('saves title, description and comment without changing graph metadata', async () => {
    const { wrapper, flow, router, click } = await openDetails()
    await wrapper.get('#title').setValue('Updated title')
    await wrapper.get('#description').setValue('Updated description')
    await wrapper.get('#comment').setValue('Updated note')
    expect(flow.nodes[0].data.name).toBe('Original title')
    await click('Submit')
    expect(flow.nodes[0]).toMatchObject({
      id: 'one',
      type: 'addComment',
      position: { x: 10, y: 20 },
      selected: true,
      data: { name: 'Updated title', description: 'Updated description', comment: 'Updated note' },
    })
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('closes the drawer after submitting within the flow page', async () => {
    const { wrapper, flow, router, click } = await openDetails([makeNode()], true)
    await wrapper.get('#title').setValue('Updated title')
    await click('Submit')
    expect(flow.nodes[0].data.name).toBe('Updated title')
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.find('#title').exists()).toBe(false)
  })

  it('blocks a blank title and clears the error on a valid submit', async () => {
    const { wrapper, flow, router, click } = await openDetails()
    await wrapper.get('#title').setValue('   ')
    await click('Submit')
    expect(wrapper.text()).toContain('Title is required.')
    expect(wrapper.get('#title').attributes('aria-invalid')).toBe('true')
    expect(flow.nodes[0].data.name).toBe('Original title')
    expect(router.currentRoute.value.path).toBe('/nodes/one')
    await wrapper.get('#title').setValue('Valid title')
    await click('Submit')
    expect(wrapper.text()).not.toContain('Title is required.')
    expect(flow.nodes[0].data.name).toBe('Valid title')
  })

  it('validates and saves business hours while preserving fixed settings', async () => {
    const { wrapper, flow, router, click } = await openDetails([
      makeNode('dateTime', {
        times: [{ day: 'mon', startTime: '09:00', endTime: '17:00' }],
        timezone: 'UTC',
        action: 'businessHours',
        connectors: ['success', 'failure'],
      }),
    ])
    expect(wrapper.get('[aria-label="Mon start time"]').element.value).toBe('09:00')
    await wrapper.get('[aria-label="Mon end time"]').setValue('08:00')
    await click('Submit')
    expect(wrapper.text()).toContain('End time must be later than start time.')
    expect(flow.nodes[0].data.times[0].endTime).toBe('17:00')
    expect(router.currentRoute.value.path).toBe('/nodes/one')
    await wrapper.get('[aria-label="Mon end time"]').setValue('18:00')
    await click('Submit')
    expect(flow.nodes[0].type).toBe('dateTime')
    expect(flow.nodes[0].data).toMatchObject({
      times: expect.arrayContaining([{ day: 'mon', startTime: '09:00', endTime: '18:00' }]),
      timezone: 'UTC',
      action: 'businessHours',
      connectors: ['success', 'failure'],
    })
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('cancels nested edits without mutating the node', async () => {
    const { wrapper, flow, router, click } = await openDetails([
      makeNode('dateTime', {
        times: [{ day: 'mon', startTime: '09:00', endTime: '17:00' }],
        timezone: 'UTC',
      }),
    ])
    await wrapper.get('#title').setValue('Discard me')
    await wrapper.get('[aria-label="Mon start time"]').setValue('10:00')
    await click('Cancel')
    expect(flow.nodes[0].data.name).toBe('Original title')
    expect(flow.nodes[0].data.times).toEqual([{ day: 'mon', startTime: '09:00', endTime: '17:00' }])
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('requires confirmation and preserves drafts when deletion is cancelled', async () => {
    const { wrapper, flow, router, click } = await openDetails()
    await wrapper.get('#title').setValue('Unsaved title')
    await wrapper.get('#comment').setValue('Unsaved comment')
    await click('Delete node')

    const confirmation = wrapper.get('[role="alert"]')
    expect(confirmation.text()).toContain('Original title')
    expect(confirmation.text()).toContain('connected edges')
    expect(flow.nodes).toHaveLength(1)
    expect(flow.nodes[0].data.name).toBe('Original title')
    expect(router.currentRoute.value.path).toBe('/nodes/one')
    expect(wrapper.find('button[type="submit"]').exists()).toBe(false)
    expect(document.activeElement.textContent.trim()).toBe('Cancel deletion')

    await wrapper.get('form').trigger('submit')
    expect(flow.nodes[0].data.name).toBe('Original title')
    expect(router.currentRoute.value.path).toBe('/nodes/one')

    await click('Cancel deletion')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('#title').element.value).toBe('Unsaved title')
    expect(wrapper.get('#comment').element.value).toBe('Unsaved comment')
    expect(document.activeElement.textContent.trim()).toBe('Delete node')
    expect(flow.nodes).toHaveLength(1)
    await click('Submit')
    expect(flow.nodes[0].data.name).toBe('Unsaved title')
    expect(flow.nodes[0].data.comment).toBe('Unsaved comment')
  })

  it('deletes only the confirmed node and its incoming and outgoing edges', async () => {
    const { wrapper, flow, router, click } = await openDetails([
      makeNode(),
      { ...makeNode(), id: 'two', selected: false },
      { ...makeNode(), id: 'three', selected: false },
    ])
    flow.edges = [
      { id: 'incoming', source: 'two', target: 'one' },
      { id: 'outgoing', source: 'one', target: 'three' },
      { id: 'remaining', source: 'two', target: 'three' },
    ]
    await wrapper.get('#title').setValue('')
    await click('Delete node')
    expect(flow.edges).toHaveLength(3)
    await click('Confirm deletion')

    expect(flow.nodes.map((node) => node.id)).toEqual(['two', 'three'])
    expect(flow.edges).toMatchObject([{ id: 'remaining', source: 'two', target: 'three' }])
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('resets deletion confirmation when switching nodes', async () => {
    const { wrapper, flow, router, click } = await openDetails([
      makeNode(),
      { ...makeNode(), id: 'two', data: { name: 'Second node', comment: 'Second note' } },
    ])
    await click('Delete node')
    await router.push('/nodes/two')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('#title').element.value).toBe('Second node')
    expect(flow.nodes).toHaveLength(2)
  })

  it('repositions remaining nodes after confirmed deletion and closes the drawer', async () => {
    const { wrapper, flow, router, click } = await openDetails(
      [
        makeNode(),
        { ...makeNode(), id: 'two', selected: false, position: { x: 1000, y: 1000 } },
        { ...makeNode(), id: 'three', selected: false, position: { x: 2000, y: 2000 } },
      ],
      true,
    )
    flow.edges = [
      { id: 'deleted', source: 'one', target: 'two' },
      { id: 'remaining', source: 'two', target: 'three' },
    ]
    await click('Delete node')
    await click('Confirm deletion')

    expect(flow.nodes.map((node) => node.id)).toEqual(['two', 'three'])
    expect(flow.nodes.map((node) => node.position)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 80 },
    ])
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.find('#title').exists()).toBe(false)
  })

  it('allows deletion of the last node', async () => {
    const { wrapper, flow, router, click } = await openDetails([makeNode()], true)
    await click('Delete node')
    await click('Confirm deletion')

    expect(flow.nodes).toEqual([])
    expect(flow.edges).toEqual([])
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.find('#title').exists()).toBe(false)
  })

  it('loads and saves one message and multiple attachment URLs in the payload', async () => {
    const { wrapper, flow, click } = await openDetails([
      makeNode('sendMessage', {
        payload: [
          { type: 'text', text: 'Hello', language: 'en' },
          { type: 'attachment', attachment: 'https://example.com/image.png' },
          { type: 'attachment', attachment: '/uploads/note.txt' },
        ],
      }),
    ])
    expect(wrapper.get('#message').element.value).toBe('Hello')
    expect(wrapper.text()).toContain('image.png')
    expect(wrapper.text()).toContain('note.txt')
    await wrapper.get('#message').setValue('Updated message')
    vi.stubGlobal(
      'URL',
      Object.assign(class extends URL {}, {
        createObjectURL: () => 'blob:http://localhost/new-file',
      }),
    )
    const file = new File(['contents'], 'new.txt', { type: 'text/plain' })
    Object.defineProperty(wrapper.get('input[type="file"]').element, 'files', {
      value: { length: 1, item: () => file },
      configurable: true,
    })
    await wrapper.get('input[type="file"]').trigger('change')
    expect(flow.nodes[0].data.files).toBeUndefined()
    await click('Submit')
    expect(flow.nodes[0].data.payload).toEqual([
      { type: 'text', text: 'Updated message', language: 'en' },
      { type: 'attachment', attachment: 'https://example.com/image.png' },
      { type: 'attachment', attachment: '/uploads/note.txt' },
      { type: 'attachment', attachment: 'blob:http://localhost/new-file' },
    ])
    expect(flow.nodes[0].data).not.toHaveProperty('files')
  })

  it('saves attachment deletion to the payload and keeps other attachments', async () => {
    const { wrapper, flow, click } = await openDetails([
      makeNode('sendMessage', {
        payload: [
          { type: 'text', text: 'Hello' },
          { type: 'attachment', attachment: '/first/note.txt' },
          { type: 'attachment', attachment: '/second/note.txt' },
        ],
      }),
    ])
    const attachment = wrapper.findAllComponents({ name: 'Attachment' })[0]
    await attachment.trigger('mouseenter')
    await attachment.get('.cursor-pointer').trigger('click')
    expect(flow.nodes[0].data.payload).toHaveLength(3)
    await click('Submit')
    expect(flow.nodes[0].data.payload).toEqual([
      { type: 'text', text: 'Hello' },
      { type: 'attachment', attachment: '/second/note.txt' },
    ])
  })

  it('creates a message node with text and attachment URLs in its payload', async () => {
    const { wrapper, flow, router, click } = await openDetails([], false, CreateNewNode)
    await wrapper.get('#title').setValue('New message node')
    await wrapper.get('[role="combobox"]').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    const option = [...document.querySelectorAll('[role="option"]')].find((item) =>
      item.textContent.includes('Send Message'),
    )
    await new DOMWrapper(option).trigger('keydown', { key: 'Enter' })
    await flushPromises()
    await wrapper.get('#message').setValue('Hello')
    vi.stubGlobal(
      'URL',
      Object.assign(class extends URL {}, {
        createObjectURL: () => 'blob:http://localhost/created-file',
      }),
    )
    Object.defineProperty(wrapper.get('input[type="file"]').element, 'files', {
      value: { length: 1, item: () => new File(['contents'], 'note.txt') },
    })
    await wrapper.get('input[type="file"]').trigger('change')
    await click('Create')
    expect(flow.nodes).toHaveLength(1)
    expect(flow.nodes[0].data.payload).toEqual([
      { type: 'text', text: 'Hello' },
      { type: 'attachment', attachment: 'blob:http://localhost/created-file' },
    ])
    expect(flow.nodes[0].data).not.toHaveProperty('files')
    expect(router.currentRoute.value.path).toBe('/')
    expect(flow.canUndo).toBe(false)
    expect(flow.canRedo).toBe(false)
  })

  it('adds message text when the existing payload has no text entry', async () => {
    const { wrapper, flow, click } = await openDetails([makeNode('sendMessage', { payload: [] })])
    await wrapper.get('#message').setValue('New message')
    await click('Submit')
    expect(flow.nodes[0].data.payload).toEqual([{ type: 'text', text: 'New message' }])
  })

  it('opens the file picker without submitting the drawer', async () => {
    const { wrapper, flow, router, click } = await openDetails([
      makeNode('sendMessage', { payload: [] }),
    ])
    await wrapper.get('#title').setValue('Unsaved title')
    await click('Upload File')
    expect(router.currentRoute.value.path).toBe('/nodes/one')
    expect(flow.nodes[0].data.name).toBe('Original title')
  })

  it('discards the previous draft and validation errors when switching nodes', async () => {
    const { wrapper, flow, router, click } = await openDetails([
      makeNode(),
      { ...makeNode(), id: 'two', data: { name: 'Second node', comment: 'Second note' } },
    ])
    await wrapper.get('#title').setValue('')
    await click('Submit')
    expect(wrapper.text()).toContain('Title is required.')
    await router.push('/nodes/two')
    await flushPromises()
    expect(wrapper.get('#title').element.value).toBe('Second node')
    expect(wrapper.get('#comment').element.value).toBe('Second note')
    expect(wrapper.text()).not.toContain('Title is required.')
    await wrapper.get('#comment').setValue('Changed second note')
    await click('Submit')
    expect(flow.nodes[0].data.comment).toBe('Note')
    expect(flow.nodes[1].data.comment).toBe('Changed second note')
  })

  it('shows a missing-node message and initializes when the node arrives', async () => {
    const { wrapper, flow } = await openDetails([])
    expect(wrapper.text()).toContain('Node not found')
    expect(wrapper.find('#title').exists()).toBe(false)
    flow.nodes.push(makeNode())
    await nextTick()
    expect(wrapper.get('#title').element.value).toBe('Original title')
  })
})
