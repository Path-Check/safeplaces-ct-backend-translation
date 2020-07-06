// app/api/case/controller.js

const _ = require('lodash');

const {
  accessCodeService,
  caseService,
  pointService,
  uploadService
} = require('../../../app/lib/db');

const durationService = require('../../lib/durationService.js');
const transform = require('../../lib/pocTransform.js');

/**
 * @method fetchCasePoints
 *
 * Returns all points of concern for the provided case.
 *
 */
exports.fetchCasePoints = async (req, res) => {
  const { caseId } = req.body;

  if (!caseId) throw new Error('Case ID is not valid.');

  let concernPoints = await caseService.fetchCasePoints(caseId);

  if (concernPoints) {
    concernPoints = transform.discreetToDuration(concernPoints)
    res.status(200).json({ concernPoints });
  }
  else {
    throw new Error(`Concern points could not be found for case id ${caseId}`);
  }
};

/**
 * @method fetchCasesPoints
 *
 * Returns all points of concern for the provided cases.
 *
 */
exports.fetchCasesPoints = async (req, res) => {
  const { caseIds } = req.body;

  if (!caseIds) {
    res.status(400).send();
    return;
  }

  let concernPoints = await caseService.fetchCasesPoints(caseIds);

  if (concernPoints) {
    concernPoints = transform.discreetToDuration(concernPoints)
    res.status(200).json({ concernPoints });
  }
  else {
    throw new Error(`Concern points could not be found for case id ${JSON.stringify(caseIds)}`);
  }
};

/**
 * @method ingestUploadedPoints
 *
 * Attempts to associate previously uploaded points with a case.
 * Returns the points of concern that were uploaded for the case with the given access code.
 *
 */
exports.ingestUploadedPoints = async (req, res) => {
  const { caseId, accessCode: codeValue } = req.body;

  if (caseId == null || codeValue == null) {
    res.status(400).send();
    return;
  }

  const accessCode = await accessCodeService.find({ value: codeValue });

  // Check access code validity
  if (!accessCode) {
    res.status(403).send();
    return;
  }

  // Check whether user has declined upload acccess
  if (!accessCode.upload_consent) {
    res.status(451).send();
    return;
  }

  const uploadedPoints = await uploadService.fetchPoints(accessCode);

  // If the access code is valid but there aren't any points yet,
  // then the upload is still in progress
  if (!uploadedPoints || uploadedPoints.length == 0) {
    res.status(202).send();
    return;
  }

  let concernPoints = await pointService.createPointsFromUpload(caseId, uploadedPoints);
  if (concernPoints) {

    await uploadService.deletePoints(accessCode);

    concernPoints = transform.discreetToDuration(concernPoints)

    res.status(200).json({ concernPoints });
  }
  throw new Error(`Concern points being returned were invalid.`);
};

/**
 * @method deleteCasePoints
 *
 * Deletes the given points of concern.
 *
 */
exports.deleteCasePoints = async (req, res) => {
  const { pointIds } = req.body;

  if (pointIds ==  null || !_.isArray(pointIds)) {
    res.status(400).send();
    return;
  }

  if (pointIds.length > 0) {
    await pointService.deleteIds(pointIds);
  }

  res.status(200).send();
};

/**
 * @method createCasePoint
 *
 * Creates a new point of concern to be associated with the case.
 *
 */
exports.createCasePoint = async (req, res) => {
  const { caseId, point } = req.body;

  if (!caseId) throw new Error('Case ID is not valid.');
  if (!point.latitude) throw new Error('Latitude is not valid.');
  if (!point.longitude) throw new Error('Latitude is not valid.');
  if (!point.time) throw new Error('Latitude is not valid.');
  if (!point.duration) throw new Error('Duration is not valid.');

  const newConcernPoints = await durationService.createDiscreetPointsFromDuration(caseId, point);

  if (newConcernPoints) {
    let durationPoint = transform.discreetToDuration(newConcernPoints);
    res.status(200).json({ concernPoint: durationPoint.shift() });
  }
  else {
    throw new Error(`Concern point could not be created for case ${caseId} using point data.`);
  }
};

/**
 * @method updateCasePoint
 *
 * Updates an existing point of concern
 *
 */
exports.updateCasePoint = async (req, res) => {
  const { body } = req;

  if (!body.discreetPointIds) throw new Error('Point ID is not valid.');
  if (!body.latitude) throw new Error('Latitude is not valid.');
  if (!body.longitude) throw new Error('Latitude is not valid.');
  if (!body.time) throw new Error('Latitude is not valid.');
  if (!body.duration) throw new Error('Duration is not valid.');
  if (!body.caseId) throw new Error('CaseId is not valid.');

  const updatedPointsData = await durationService.updateDiscreetPointsFromDuration(body);

  if (updatedPointsData) {
    [concernPoint] = transform.discreetToDuration(updatedPointsData);
    res.status(200).json({ concernPoint });
  }
  else {
    throw new Error(`Concern point could not be updated for point ${pointId} using point data.`);
  }
};

/**
 * @method updateCasePoints
 *
 * Updates existing points of concern
 *
 */
exports.updateCasePoints = async (req, res) => {
  const {
    body,
    body: { pointIds },
  } = req;

  if (!pointIds) throw new Error('Point IDs are not valid.');

  const params = _.pick(body, ['nickname']);

  let concernPoints = await pointService.updateRedactedPoints(
    pointIds,
    params,
  );

  if (concernPoints) {
    concernPoints = transform.discreetToDuration(concernPoints)
    res.status(200).json({ concernPoints });
  } else {
    throw new Error(
      `Concern points could not be updated for points ${pointIds}.`,
    );
  }
};

/**
 * @method deleteCasePoint
 *
 * Deletes the point of concern having the ID corresponding with the pointID param.
 *
 */
exports.deleteCasePoint = async (req, res) => {
  const { pointId } = req.body;

  if (!pointId) throw new Error('Case ID is not valid.')

  const caseResults = await pointService.deleteWhere({ id: pointId });

  if (caseResults) {
    res.sendStatus(200);
  }
  else {
    throw new Error(`Concern point could not be deleted for point ${pointId}.`);
  }
};
