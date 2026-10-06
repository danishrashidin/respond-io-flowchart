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
    await wrapper
      .findAll('button')
      .find((button) => button.text() === text)
      .trigger('click')
    await flushPromises()
  }
  return { wrapper, flow, router, click }
}

describe('node details', () => {
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
    expect(flow.nodes[0]).toEqual({
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
