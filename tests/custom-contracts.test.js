import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseNode from '@/components/node/BaseNode.vue'
import Attachment from '@/components/forms/sendMessage/Attachment.vue'
import SendMessageNode from '@/components/node/custom/SendMessageNode.vue'
import BusinessHoursNode from '@/components/node/custom/BusinessHoursNode.vue'
import AddCommentNode from '@/components/node/custom/AddCommentNode.vue'
import DtConnectorNode from '@/components/node/custom/DtConnectorNode.vue'
import { makeNodeProps } from './fixtures/nodeProps.js'

describe('custom component public contracts', () => {
  it('base node renders its title and optional description', async () => {
    const wrapper = mount(BaseNode, { props: { title: 'Welcome' } })
    expect(wrapper.text()).toContain('Welcome')
    await wrapper.setProps({ description: 'Description' })
    expect(wrapper.text()).toContain('Description')
  })
  it('base node warns when its required title is omitted', () => {
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(BaseNode)
    expect(warnings.mock.calls.flat().join(' ')).toContain('Missing required prop: "title"')
  })
  it('attachment accepts a string path and emits its full path on deletion', async () => {
    const wrapper = mount(Attachment, { props: { file: '/uploads/example.txt' } })
    expect(wrapper.text()).toContain('example.txt')
    await wrapper.trigger('mouseenter')
    await wrapper.get('.cursor-pointer').trigger('click')
    expect(wrapper.emitted('delete')).toEqual([['/uploads/example.txt']])
  })
  it.each([
    [SendMessageNode, { name: 'Welcome', payload: [{ type: 'text', text: 'Hello' }] }, 'Hello'],
    [BusinessHoursNode, { name: 'Office', timezone: 'UTC', times: [] }, 'Office'],
    [AddCommentNode, { name: 'Comment', comment: 'Note' }, 'Note'],
    [DtConnectorNode, { connectorType: 'success' }, 'success'],
  ])('%s consumes graph metadata without DOM fallthrough', (component, data, expectedText) => {
    const wrapper = mount(component, { props: makeNodeProps(data) })
    expect(wrapper.text()).toContain(expectedText)
    const attributes = Object.keys(wrapper.attributes())
    for (const name of ['parentnodeid', 'sourceposition', 'events', 'position', 'dimensions']) {
      expect(attributes).not.toContain(name)
    }
  })
})
