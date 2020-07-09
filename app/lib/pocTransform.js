const _ = require('lodash');

// input:      array of Point of Concern data in discreet format
// output:  array of Point of Concern data in duration format

const discreetToDuration = discreetArr => {
  let i, curDiscreet, curDuration;
  const durationArr = [];

  discreetArr.sort((a, b) => (Date.parse(a.time) > Date.parse(b.time) ? 1 : -1));

  for (i = 0; i < discreetArr.length; i++) {
    curDiscreet = discreetArr[i];

    if (i === 0) {
      curDiscreet.discreetPointIds = [ curDiscreet.id ];
      durationArr[0] = { ..._.omit(curDiscreet, ['id', 'pointId']), duration: 5 };
    } else {
      curDuration = durationArr[durationArr.length - 1];
      if (!curDuration.discreetPointIds) {
        curDuration.discreetPointIds = [curDuration.id];
      }

      if (discreetMergeCondition(curDiscreet, curDuration)) {
        durationArr[durationArr.length - 1] = discreetMerge(
          curDiscreet,
          curDuration,
        );

        curDuration.discreetPointIds.push(curDiscreet.id);
      } else {
        durationArr[durationArr.length] = {
          ..._.omit(curDiscreet, ['id', 'pointId']),
          discreetPointIds: [curDiscreet.id],
          duration: 5,
        };
      }
    }
  }

  // return roundDuration(durationArr);
  return durationArr;
};

// input:      array of Point of Concern data in duration format
// output:  array of Point of Concern data in discreet format
const durationToDiscreet = durationArr => {
  let discreetArr = [];

  durationArr.sort((a, b) => (Date.parse(a.time) > Date.parse(b.time) ? 1 : -1));

//  roundDuration(durationArr)

  for (let i = 0; i < durationArr.length; i++) {
    discreetArr = [
      ...discreetArr,
      ...durationPointToDiscreetPoints(durationArr[i]),
    ];
  }

  return discreetArr;
};

const MINUTE = 60 * 1000;

const discreetMergeCondition = (curDiscreet, curDuration) => {
  if (curDiscreet.caseId !== curDuration.caseId) {
    return false;
  }
  if (curDiscreet.latitude !== curDuration.latitude) {
    return false;
  }
  if (curDiscreet.longitude !== curDuration.longitude) {
    return false;
  }
  if (Date.parse(curDiscreet.time) > Date.parse(curDuration.time) + curDuration.duration * MINUTE) {
    return false;
  }
  return true;
};

const discreetMerge = (curDiscreet, curDuration) => {
  const rawDuration =
    (Date.parse(curDiscreet.time) + 5 * MINUTE - Date.parse(curDuration.time)) / MINUTE;

  return { ...curDuration, duration: rawDuration };
};


const durationPointToDiscreetPoints = durationPoint => {
  const discreetPoints = [];
  let i;
  for (i = 0; i < durationPoint.duration / 5; i++) {
    discreetPoints[i] = {
      latitude: durationPoint.latitude,
      longitude: durationPoint.longitude,
      time: Date.parse(durationPoint.time) + i * 5 * MINUTE,
      publish_date: durationPoint.publish_date,
      nickname: durationPoint.nickname,
    };
  }
  return discreetPoints;
};

module.exports = {
  discreetToDuration,
  durationToDiscreet
};
