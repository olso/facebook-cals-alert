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

function getVALARM() {
  const id = uuid()

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

  calendar.subComponents.forEach((event) => {
    getVALARM().forEach(({k, v} = field) => {
      event.addRawField(k, v)
    })
  })

  return new Buffer(calendar.toString(), {
    'Content-Type': 'text/calendar; charset=utf-8'
  })
};
