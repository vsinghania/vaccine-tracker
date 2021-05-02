const request = require('request');
const config = require('./config');
const Mailer = require('./mailer');
let mailer;
const districts = {
  '294': 'BBMP',
  '265': 'Bangalore Urban',
}

const district_recipient_map = {
  'BBMP': ['abc@xyz.com', 'xyz@abc.com'],
  'Bangalore Urban': ['pqr@def.com', 'xyz@abc.com']
}
const base_url = 'https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict';

async function checkForAvailability() {

  const date_str = constructDateStr();
  for (const district_id of Object.keys(districts)) {
    const url = `${base_url}?district_id=${district_id}&date=${date_str}`;
    console.log(`Checking for ${districts[district_id]}`);
    const vac_info = await fetchVacInfo(url);
    if (!vac_info) {
      await delay(1);
      continue;
    }
    const centers = getEligibleCenters(vac_info.centers);
    if (centers.length > 0) {
      console.log(`Found slots for ${districts[district_id]}`);
      await mailer.alert({ district: districts[district_id], centers: centers });
    } else {
      console.log(`No slots found for ${districts[district_id]}.`);
    }
    await delay(1);
  }
}

function getEligibleCenters(centers) {
  const center_list = []

  for (const center of centers) {
    if (!center.sessions) {
      continue;
    }
    const match_sessions = center.sessions.filter(session => (session.min_age_limit < 30) && (session.available_capacity >= config.AVAILABILITY_THRESHOLD));
    if (match_sessions.length == 0) {
      continue;
    }
    center_list.push({
      name: center.name,
      block: center.block_name,
      district: center.district_name,
      state: center.state_name,
      pincode: center.pincode,
      sessions: match_sessions.map(s => { return { vaccine: s.vaccine, date: s.date, available: s.available_capacity } })
    })
  }

  return center_list;
}

async function fetchVacInfo(url, retries = 3) {
  const response = await requestAsync(url);
  if (response.statusCode != 200) {
    if (retries >= 0) {
      console.log(`Received ${response.statusCode} Retrying ...`);
      await delay(1);
      return fetchVacInfo(url, retries - 1);
    }
    console.error(`Recevied status code ${response.statusCode} for url: ${url}. Skipping ...`);
    return;
  }
  const info = JSON.parse(response.body);
  return info;
}

function requestAsync(url, options = { timeout: 30000 }) {
  return new Promise((res, rej) => {
    request.get(url, options, (error, response) => {
      if (error) {
        return rej(error);
      }
      return res(response);
    })
  })
}

function constructDateStr() {

  const epoch = Date.now() + (330 * 60 * 1000);
  const today = new Date(epoch);
  let date = today.getDate();
  if (date < 10) {
    date = '0' + date;
  }
  let month = today.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  const year = today.getFullYear();
  const date_str = `${date}-${month}-${year}`;
  return date_str;
}
function delay(sec) {
  return new Promise(function (resolve) {
    setTimeout(resolve, sec * 1000)
  });
}

function init() {
  mailer = new Mailer(district_recipient_map)
  checkForAvailability();
  setInterval(() => {
    checkForAvailability();
  }, config.POLL_FREQUENCY);
}

init();