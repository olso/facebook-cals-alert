const { ICalParser, VCalendar, VEvent } = require('cozy-ical')
const nodeFetch = require('node-fetch')
const uuid = require('uuid/v4')

async function parseIcsData(icsData) {
  const parser = new ICalParser()

  return new Promise((resolve, reject) => {
    parser.parseString(icsData, (err, cal) => {
      if (err) {
        return reject(err)
      }

      resolve(cal)
    })
  })
}

async function fetch(url) {
  return nodeFetch(url).then(res => res.text())
}

function decorateEventWithAlarm(event) {
  const uid = event.getTextFieldValue('UID') || uuid()

  const alarmFields = [
    {k: 'BEGIN', v: 'VALARM'},
    {k: 'TRIGGER', v: '-PT30M'},
    {k: 'REPEAT', v: '1'},
    {k: 'DURATION', v: 'PT15M'},
    {k: 'DESCRIPTION', v: event.model.summary},
    {k: 'ACTION', v: 'DISPLAY'},
    {k: 'UID', v: uid},
    {k: 'X-WR-ALARMUID', v: uid},
    {k: 'END', v: 'VALARM'}
  ]

  for (const { k, v } of alarmFields) {
    event.addRawField(k, v)
  }

  return event
}

function buildCalendar(originalCalendar) {
  const calendar = new VCalendar(originalCalendar.model)

  for (const originalEvent of originalCalendar.subComponents) {
    // ... doesn't work
    const url = originalEvent.getTextFieldValue('URL') || ''
    originalEvent.model.description = `${url}\n${originalEvent.model.description}`
    const event = new VEvent(originalEvent.model)
    const eventWithAlarm = decorateEventWithAlarm(event)
    calendar.add(eventWithAlarm)
  }

  return calendar.toString()
}

/**
 * https://tools.ietf.org/html/rfc5545
 * 
 * @param {string} icsCalendarUrl
 * @returns {buffer}
 */
module.exports = async (icsCalendarUrl = '') => {
  const icsData = await fetch(icsCalendarUrl)
  const calendar = await parseIcsData(icsData)

  return new Buffer(buildCalendar(calendar), {
    'Content-Type': 'text/calendar; charset=utf-8'
  })
}
