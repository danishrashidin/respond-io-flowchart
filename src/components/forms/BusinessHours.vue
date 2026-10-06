<template>
  <div class="flex flex-col gap-4">
    <p
      class="inline-flex flex-row items-center gap-2 text-left text-lg font-semibold text-neutral-900"
    >
      <CalendarDays class="h-5 text-orange-600" />
      Business Hours
    </p>
    <Separator />
    <div class="grid grid-cols-5 gap-y-4 gap-x-2 place-items-center">
      <p class="inline-flex flex-row items-center gap-1 text-xs text-neutral-500 col-span-1">
        <CalendarFold class="h-4" /> Day
      </p>
      <p class="inline-flex flex-row items-center gap-1 text-xs text-neutral-500 col-span-4">
        <Clock class="h-4" /> Time
      </p>
      <template v-for="day in daysOfWeek" :key="day">
        <p class="text-center text-xs font-normal text-neutral-900 col-span-1">
          {{ day }}
        </p>
        <div class="inline-flex flex-row gap-2 items-start col-span-4 w-full">
          <Field :data-invalid="!!getTimeError(day, 'startTime')">
            <Input
              :model-value="dayTimesMap[day.toLowerCase()].startTime"
              @update:model-value="(val) => handleTimeUpdate(day.toLowerCase(), false, String(val))"
              :aria-invalid="!!getTimeError(day, 'startTime')"
              :aria-label="`${day} start time`"
              type="time"
              class="text-xs"
            />
            <FieldError v-if="getTimeError(day, 'startTime')">{{
              getTimeError(day, 'startTime')
            }}</FieldError>
          </Field>
          <p class="text-xs font-normal text-neutral-500 h-9 inline-flex items-center">to</p>
          <Field :data-invalid="!!getTimeError(day, 'endTime')">
            <Input
              :model-value="dayTimesMap[day.toLowerCase()].endTime"
              @update:model-value="(val) => handleTimeUpdate(day.toLowerCase(), true, String(val))"
              :aria-invalid="!!getTimeError(day, 'endTime')"
              :aria-label="`${day} end time`"
              type="time"
              class="text-xs"
            />
            <FieldError v-if="getTimeError(day, 'endTime')">{{
              getTimeError(day, 'endTime')
            }}</FieldError>
          </Field>
        </div>
      </template>
    </div>
    <Field class="mt-4" :data-invalid="!!form.formErrors.value.timezone">
      <FieldLabel for="timezone">Timezone</FieldLabel>
      <Select id="timezone" v-model="data.timezone">
        <SelectTrigger :aria-invalid="!!form.formErrors.value.timezone">
          <SelectValue placeholder="Pick your timezone" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in timezoneOptions" :key="option.value" :value="option.value">{{
            option.label
          }}</SelectItem>
        </SelectContent>
      </Select>
      <FieldError v-if="form.formErrors.value.timezone">{{
        form.formErrors.value.timezone
      }}</FieldError>
    </Field>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CalendarDays } from '@lucide/vue'
import { Separator } from '../ui/separator'
import dayjs from 'dayjs'
import { CalendarFold, Clock } from '@lucide/vue'
import { Input } from '../ui/input'
import { Field, FieldError, FieldLabel } from '../ui/field'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../ui/select'
import { listAllTimezoneOffsets } from '@/lib/time'
import { useBusinessHoursForm } from '@/composables/useBusinessHoursForm'

const daysOfWeek = Array.from({ length: 7 }).map((_, index) => dayjs().day(index).format('ddd'))

const timezoneOptions = listAllTimezoneOffsets()
  .map(({ timezone, offset }) => {
    return {
      label: `(GMT${offset}) ${timezone}`,
      value: timezone,
    }
  })
  .sort((a, b) => a.label.localeCompare(b.label))

const data = defineModel({
  type: Object,
  required: true,
})

const form = useBusinessHoursForm()

const getTimeError = (day, field) => form.formErrors.value[`times.${day.toLowerCase()}.${field}`]

defineExpose({
  validate: () => {
    form.validate(data.value)
    return Object.keys(form.formErrors.value).length === 0
  },
})

const dayTimesMap = computed({
  get() {
    return daysOfWeek.reduce((prev, curr) => {
      const existingDay = data.value.times.find(
        (time) => time.day.toLowerCase() === curr.toLowerCase(),
      )
      return {
        ...prev,
        [curr.toLowerCase()]: {
          startTime: existingDay?.startTime || null,
          endTime: existingDay?.endTime || null,
        },
      }
    }, {})
  },
  set(value) {
    const arr = Object.keys(value).map((key) => {
      return {
        day: key,
        startTime: value[key]?.startTime || null,
        endTime: value[key]?.endTime || null,
      }
    })
    data.value.times = [...arr]
  },
})

const handleTimeUpdate = (day, isEndTime = false, value) => {
  const times = dayTimesMap.value[day]
  dayTimesMap.value = {
    ...dayTimesMap.value,
    [day]: {
      ...(!isEndTime
        ? { startTime: value, endTime: times?.endTime }
        : { endTime: value, startTime: times?.startTime }),
    },
  }
}
</script>
