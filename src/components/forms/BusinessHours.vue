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
      <template v-for="day in daysOfWeek">
        <p class="text-center text-xs font-normal text-neutral-900 col-span-1">{{ day }}</p>
        <div class="inline-flex flex-row gap-2 items-center col-span-4 w-full">
          <Input
            :model-value="dayTimesMap[day.toLowerCase()]!.startTime"
            @update:model-value="(val) => handleTimeUpdate(day.toLowerCase(), false, String(val))"
            type="time"
            class="text-xs"
          />
          <p class="text-xs font-normal text-neutral-500">to</p>
          <Input
            :model-value="dayTimesMap[day.toLowerCase()]!.endTime"
            @update:model-value="(val) => handleTimeUpdate(day.toLowerCase(), true, String(val))"
            type="time"
            class="text-xs"
          />
        </div>
      </template>
    </div>
    <Field class="mt-4">
      <FieldLabel for="timezone">Timezone</FieldLabel>
      <Select id="timezone" v-model="data.timezone">
        <SelectTrigger>
          <SelectValue placeholder="Pick your timezone" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in timezoneOptions" :value="option.value">{{
            option.label
          }}</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays } from '@lucide/vue'
import { Separator } from '../ui/separator'
import dayjs from 'dayjs'
import { CalendarFold, Clock } from '@lucide/vue'
import { Input } from '../ui/input'
import { Field, FieldLabel } from '../ui/field'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../ui/select'
import { listAllTimezoneOffsets } from '@/lib/time'
import type { BusinessHoursData } from '@/lib/types'

const daysOfWeek = Array.from({ length: 7 }).map((_, index) => dayjs().day(index).format('ddd'))

const timezoneOptions = listAllTimezoneOffsets()
  .map(({ timezone, offset }) => {
    return {
      label: `(GMT${offset}) ${timezone}`,
      value: timezone,
    }
  })
  .sort((a, b) => a.label.localeCompare(b.label))

const data = defineModel<BusinessHoursData>({
  required: true,
})

const dayTimesMap = computed<{
  [key: string]: {
    startTime: string | undefined
    endTime: string | undefined
  }
}>({
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

const handleTimeUpdate = (day: string, isEndTime: boolean = false, value: string) => {
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
