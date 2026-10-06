import { afterEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import AddComments from '@/components/forms/AddComments.vue'
import SendMessage from '@/components/forms/SendMessage.vue'
import BusinessHours from '@/components/forms/BusinessHours.vue'
import Attachment from '@/components/forms/sendMessage/Attachment.vue'
import { useSendMessageForm } from '@/composables/useSendMessageForm'

afterEach(() => vi.unstubAllGlobals())

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
  it('validates attachment strings and rejects File objects', () => {
    const form = useSendMessageForm()
    form.validate({
      message: 'Hello',
      files: ['https://example.com/image.png', '/uploads/note.txt'],
    })
    expect(form.formErrors.value).toEqual({})
    form.validate({ message: 'Hello', files: [new File(['note'], 'note.txt')] })
    expect(form.formErrors.value).toHaveProperty('files')
  })
  it('displays an attachment filename and deletes by its full URL', async () => {
    const path = 'https://example.com/files/note.txt?token=abc'
    const wrapper = mount(Attachment, { props: { file: path } })
    expect(wrapper.text()).toContain('note.txt')
    await wrapper.trigger('mouseenter')
    await wrapper.get('.cursor-pointer').trigger('click')
    expect(wrapper.emitted('delete')).toEqual([[path]])
  })
  it('deletes only the matching full path when filenames are the same', async () => {
    const paths = ['/first/note.txt', '/second/note.txt']
    const wrapper = mount(SendMessage, { props: { files: paths } })
    const attachment = wrapper.findAllComponents(Attachment)[0]
    await attachment.trigger('mouseenter')
    await attachment.get('.cursor-pointer').trigger('click')
    expect(wrapper.emitted('update:files').at(-1)).toEqual([['/second/note.txt']])
  })
  it('converts multiple selected files to full blob URLs', async () => {
    const createObjectURL = vi
      .fn()
      .mockReturnValueOnce('blob:http://localhost/first')
      .mockReturnValueOnce('blob:http://localhost/second')
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL }))
    const paths = ref(['/existing/note.txt'])
    const wrapper = mount({
      components: { SendMessage },
      setup: () => ({ files: paths }),
      template: '<SendMessage v-model:files="files" />',
    })
    const files = [new File(['one'], 'one.txt'), new File(['two'], 'two.txt')]
    const input = wrapper.get('input[type="file"]')
    expect(input.attributes()).toHaveProperty('multiple')
    Object.defineProperty(input.element, 'files', {
      value: { length: 2, item: (index) => files[index] },
    })
    await input.trigger('change')
    expect(paths.value).toEqual([
      '/existing/note.txt',
      'blob:http://localhost/first',
      'blob:http://localhost/second',
    ])
    expect(input.element.value).toBe('')
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
