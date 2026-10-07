import { afterEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import SendMessage from '@/components/forms/SendMessage.vue'
import BusinessHours from '@/components/forms/BusinessHours.vue'
import Attachment from '@/components/forms/sendMessage/Attachment.vue'
import { useSendMessageForm } from '@/composables/useSendMessageForm'

afterEach(() => vi.unstubAllGlobals())

describe('form behavior', () => {
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
  it('adds Monday business hours to an empty schedule', async () => {
    const data = { times: [], timezone: 'UTC' }
    const wrapper = mount(BusinessHours, { props: { modelValue: data } })
    await wrapper.get('[aria-label="Mon start time"]').setValue('09:00')
    expect(data.times).toContainEqual({ day: 'mon', startTime: '09:00', endTime: null })
    expect(data.timezone).toBe('UTC')
  })
})
