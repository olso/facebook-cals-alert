const r2 = require('r2')
const { ICalParser } = require('cozy-ical')

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

/**
 * @param {string} icsCalendarUrl
 * @param {string} trigger
 * @returns {buffer}
 */
module.exports = async (icsCalendarUrl = '', trigger = '-P1H') => {
  const icsData = await r2(icsCalendarUrl).text
  const calendar = await parseIcsData(icsData)

  calendar.subComponents.forEach((event) => {
    event.addRawField('TRIGGER', trigger)
  })

  return new Buffer(calendar.toString(), {
    'Content-Type': 'text/calendar; charset=utf-8'
  })
};
