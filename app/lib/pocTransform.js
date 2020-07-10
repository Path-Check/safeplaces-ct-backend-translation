const _ = require('lodash');

// input:      array of Point of Concern data in discreet format
// output:  array of Point of Concern data in duration format

const discreetToDuration = discreetArr => {
  let i, curDiscreet, curDuration;
  let durationArr = [];

  // TODO: make this more performant

  // need to group by caseId on points
  let discreetPointsByCase = _.groupBy(discreetArr, 'caseId');

  // sort each grouping by time
  discreetPointsByCase = _.map(discreetPointsByCase, function(casePoints) {
    return casePoints.sort((a, b) => (a.time > b.time ? 1 : -1));
  });
  
  for(let t = 0; t < discreetPointsByCase.length; t++) {
    let discreetCaseArr = discreetPointsByCase[t];
    let durationCaseArr = [];

    for (i = 0; i < discreetCaseArr.length; i++) {
      curDiscreet = discreetCaseArr[i];

      if (i === 0) {
        curDiscreet.discreetPointIds = [ curDiscreet.id ];
        durationCaseArr[0] = { ..._.omit(curDiscreet, ['id', 'pointId']), duration: 5 };
      } else {
        curDuration = durationCaseArr[durationCaseArr.length - 1];
        if (!curDuration.discreetPointIds) {
          curDuration.discreetPointIds = [curDuration.id];
        }

        if (discreetMergeCondition(curDiscreet, curDuration)) {
          durationCaseArr[durationCaseArr.length - 1] = discreetMerge(
            curDiscreet,
            curDuration,
          );

          curDuration.discreetPointIds.push(curDiscreet.id);
        } else {
          durationCaseArr[durationCaseArr.length] = {
            ..._.omit(curDiscreet, ['id', 'pointId']),
            discreetPointIds: [curDiscreet.id],
            duration: 5,
          };
        }
      }

      // add duration points for case before moving on to the next case
      if (i == discreetCaseArr.length - 1) {
        durationArr = durationArr.concat(durationCaseArr)
      }
    }
  }

  // map time value of duration points from milliseconds to time object
  durationArr = _.map(durationArr, function(durationPoint) {
      durationPoint.time = new Date(durationPoint.time);
      return durationPoint;
  });

  return durationArr;
};

// input:   array of Point of Concern data in duration format
// output:  array of Point of Concern data in discreet format
const durationToDiscreet = durationArr => {
  let discreetArr = [];

  durationArr.sort((a, b) => (a.time > b.time ? 1 : -1));

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
  } if (curDiscreet.time > curDuration.time + curDuration.duration * MINUTE) { 
    return false; 
  }
  return true;
};

const discreetMerge = (curDiscreet, curDuration) => {
  const rawDuration = curDuration.duration + 5;

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
