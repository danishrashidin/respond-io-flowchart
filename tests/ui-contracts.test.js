import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h, defineComponent } from 'vue'
import { SelectRoot } from 'reka-ui'
import Input from '@/components/ui/input/Input.vue'
import Textarea from '@/components/ui/textarea/Textarea.vue'
import Select from '@/components/ui/select/Select.vue'
import SidebarProvider from '@/components/ui/sidebar/SidebarProvider.vue'
import { useSidebar } from '@/components/ui/sidebar/utils'

const SidebarConsumer = defineComponent({
  setup() {
    const { state, toggleSidebar } = useSidebar()
    return () => h('button', { onClick: toggleSidebar }, state.value)
  },
})

describe('UI contracts retained by regeneration', () => {
  it.each([
    [Input, 'input'],
    [Textarea, 'textarea'],
  ])('%s keeps number values and emits field edits', async (component, tag) => {
    const wrapper = mount(component, { props: { modelValue: 0 } })
    expect(wrapper.get(tag).element.value).toBe('0')
    await wrapper.get(tag).setValue('changed')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['changed'])
  })
  it('omitted open honors the uncontrolled sidebar default', async () => {
    const wrapper = mount(SidebarProvider, {
      props: { defaultOpen: true },
      slots: { default: () => h(SidebarConsumer) },
    })
    expect(wrapper.get('button').text()).toBe('expanded')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.get('button').text()).toBe('collapsed')
  })
  it('explicit false controls the sidebar and emits a toggle request', async () => {
    const wrapper = mount(SidebarProvider, {
      props: { defaultOpen: true, open: false },
      slots: { default: () => h(SidebarConsumer) },
    })
    expect(wrapper.get('button').text()).toBe('collapsed')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:open').at(-1)).toEqual([true])
    await wrapper.setProps({ open: true })
    expect(wrapper.get('button').text()).toBe('expanded')
  })
  it('select forwards disabled state, Boolean omission, and model/open events', async () => {
    const wrapper = mount(Select, { props: { disabled: true } })
    const root = wrapper.findComponent(SelectRoot)
    expect(root.props('disabled')).toBe(true)
    expect(root.props('multiple')).toBe(false)
    root.vm.$emit('update:modelValue', 'addComment')
    root.vm.$emit('update:open', true)
    await flushPromises()
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['addComment'])
    expect(wrapper.emitted('update:open').at(-1)).toEqual([true])
  })
})
