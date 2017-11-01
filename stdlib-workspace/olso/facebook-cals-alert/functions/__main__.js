const { ICalParser } = require('cozy-ical')
const nodeFetch = require('node-fetch')

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

/**
 * @param {string} icsCalendarUrl
 * @param {string} trigger
 * @returns {buffer}
 */
module.exports = async (icsCalendarUrl = '', trigger = '-P1H') => {

  const icsData = await fetch(icsCalendarUrl)
  const calendar = await parseIcsData(icsData)

  calendar.subComponents.forEach((event) => {
    event.addRawField('TRIGGER', trigger)
  })

  return new Buffer(calendar.toString(), {
    'Content-Type': 'text/calendar; charset=utf-8'
  })
};
