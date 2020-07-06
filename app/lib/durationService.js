const _ = require('lodash');
const {
  caseService,
  pointService,
} = require('./db');
const transform = require('./pocTransform.js');

class DurationService {
  async createDiscreetPointsFromDuration(caseId, durationPoint) {
    let discreetConcernPointsData = transform.durationToDiscreet([ durationPoint ]);

    const promises = await discreetConcernPointsData.map(async point => {
      const newPoint = await caseService.createCasePoint(caseId, point);
      return newPoint
    });

    return await Promise.all(promises);
  }

  async updateDiscreetPointsFromDuration(durationPoint) {
    const params = _.pick(durationPoint, [
      'longitude',
      'latitude',
      'time',
      'duration',
      'nickname',
    ]);

    // TODO: wrap this in a transation
    await pointService.deleteIds(durationPoint.discreetPointIds);
    return await this.createDiscreetPointsFromDuration(durationPoint.caseId, params)
  }
};

module.exports = new DurationService();
