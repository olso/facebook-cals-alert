const { ICalParser } = require('cozy-ical')
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

function getVALARM(id) {
  return [
    {k: 'BEGIN', v: 'VALARM'},
    {k: 'TRIGGER', v: '-PT30M'},
    {k: 'REPEAT', v: '1'},
    {k: 'DURATION', v: 'PT15M'},
    {k: 'DESCRIPTION', v: 'FB Event Alert'},
    {k: 'ACTION', v: 'DISPLAY'},
    {k: 'UID', v: id},
    {k: 'X-WR-ALARMUID', v: id},
    {k: 'END', v: 'VALARM'}
  ]
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

  for (const event of calendar.subComponents) {
    const description = event.getTextFieldValue('DESCRIPTION')
    const url = event.getTextFieldValue('URL') || ''
    const uid = event.getTextFieldValue('UID') || uuid()
    event.addTextField('DESCRIPTION', `${url}\n${description}`)

    const valarm = getVALARM(uid)
    for (const { k, v } of valarm) {
      event.addRawField(k, v)
    }
  }

  return new Buffer(calendar.toString(), {
    'Content-Type': 'text/calendar; charset=utf-8'
  })
}
