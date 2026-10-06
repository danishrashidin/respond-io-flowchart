import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AddComments from '@/components/forms/AddComments.vue'
import SendMessage from '@/components/forms/SendMessage.vue'
import BusinessHours from '@/components/forms/BusinessHours.vue'

describe('form model contracts', () => {
  it('comments emits edits on its default model without modifier fallthrough', async () => {
    const wrapper = mount(AddComments, { props: { modelModifiers: { trim: true } } })
    await wrapper.get('textarea').setValue('Note')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['Note'])
    expect(wrapper.attributes()).not.toHaveProperty('modelmodifiers')
  })
  it('message and files retain named defaults with independent arrays', async () => {
    const first = mount(SendMessage, { props: { messageModifiers: { trim: true } } })
    const second = mount(SendMessage)
    expect(first.get('textarea').element.value).toBe('')
    expect(first.props('files')).toEqual([])
    expect(first.props('files')).not.toBe(second.props('files'))
    await first.get('textarea').setValue('Hello')
    expect(first.emitted('update:message').at(-1)).toEqual(['Hello'])
    expect(first.attributes()).not.toHaveProperty('messagemodifiers')
  })
  it('business hours keeps its object model and updates Monday time', async () => {
    const data = { times: [], timezone: 'UTC' }
    const wrapper = mount(BusinessHours, { props: { modelValue: data } })
    expect(wrapper.props('modelValue').timezone).toBe('UTC')
    await wrapper.findAll('input[type="time"]')[2].setValue('09:00')
    expect(data.times).toContainEqual({ day: 'mon', startTime: '09:00', endTime: null })
  })
  it('business hours warns when its required model is absent', () => {
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(BusinessHours)).toThrow()
    expect(warnings.mock.calls.flat().join(' ')).toContain('Missing required prop: "modelValue"')
  })
})
