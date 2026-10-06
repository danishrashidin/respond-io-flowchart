export function listAllTimezoneOffsets() {
  const timezones = Intl.supportedValuesOf('timeZone')
  return timezones.map((tz) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'longOffset',
    }).formatToParts(new Date())
    const tzName = parts.find((p) => p.type === 'timeZoneName').value
    const offset = tzName === 'GMT' ? '+00:00' : tzName.replace('GMT', '')
    return { timezone: tz, offset }
  })
}
