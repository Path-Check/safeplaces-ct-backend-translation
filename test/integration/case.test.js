process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://localhost/safeplaces_test';

const { caseService, pointService } = require('../../app/lib/db');
const _ = require('lodash');
const chai = require('chai');
const should = chai.should(); // eslint-disable-line
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const mockData = require('../lib/mockData');

const app = require('../../app');
const server = app.getTestingServer();

chai.use(chaiHttp);

let currentOrg, currentCase, token;

describe('Case', () => {
  before(async () => {
    await mockData.clearMockData();

    let orgParams = {
      name: 'My Example Organization',
      info_website_url: 'http://sample.com',
    };
    currentOrg = await mockData.mockOrganization(orgParams);

    let newUserParams = {
      username: 'myAwesomeUser',
      organization_id: currentOrg.id,
    };
    const user = await mockData.mockUser(newUserParams);

    token = jwt.sign(
      {
        sub: user.idm_id,
        iat: ~~(Date.now() / 1000),
        exp:
          ~~(Date.now() / 1000) +
          (parseInt(process.env.JWT_EXP) || 1 * 60 * 60), // Default expires in an hour
      },
      process.env.JWT_SECRET,
    );
  });

  describe('fetch case points', () => {
    before(async () => {
      await caseService.deleteAllRows();

      const caseParams = {
        organization_id: currentOrg.id,
        state: 'published',
      };
      currentCase = await mockData.mockCase(caseParams);

      // Add Trails
      let trailsParams = {
        caseId: currentCase.caseId,
      };
      await mockData.mockTrails(10, 300, trailsParams); // Generate 10 trails 30 min apart
    });

    it('and return multiple case points', async () => {
      const results = await chai
        .request(server)
        .post(`/case/points`)
        .set('Cookie', `access_token=${token}`)
        .set('content-type', 'application/json')
        .send({ caseId: currentCase.caseId });

      results.error.should.be.false;
      results.should.have.status(200);
      results.body.should.be.a('object');
      results.body.should.have.property('concernPoints');
      results.body.concernPoints.should.be.a('array');
      results.body.concernPoints.length.should.equal(10);

      const firstChunk = results.body.concernPoints.shift();
      firstChunk.should.have.property('discreetPointIds');
      firstChunk.should.have.property('longitude');
      firstChunk.should.have.property('latitude');
      firstChunk.should.have.property('time');
      firstChunk.should.have.property('nickname');
    });
  });

  describe('fetch points for multiple cases', () => {
    let caseOne, caseTwo, caseThree;

    before(async () => {
      await caseService.deleteAllRows();

      const caseParams = {
        organization_id: currentOrg.id,
        state: 'staging',
      };
      caseOne = await mockData.mockCase(caseParams);
      caseTwo = await mockData.mockCase(caseParams);
      caseThree = await mockData.mockCase(caseParams);

      await mockData.mockTrails(10, 1800, { caseId: caseOne.caseId }); // Generate 10 trails 30 min apart
      await mockData.mockTrails(10, 1800, { caseId: caseTwo.caseId }); // Generate 10 trails 30 min apart
      await mockData.mockTrails(10, 1800, { caseId: caseThree.caseId }); // Generate 10 trails 30 min apart
    });

    it('and return points for all cases', async () => {
      const results = await chai
        .request(server)
        .post(`/cases/points`)
        .set('Cookie', `access_token=${token}`)
        .set('content-type', 'application/json')
        .send({ caseIds: [caseOne.caseId, caseTwo.caseId, caseThree.caseId] });

      results.error.should.be.false;
      results.should.have.status(200);
      results.body.should.be.a('object');
      results.body.should.have.property('concernPoints');
      results.body.concernPoints.should.be.a('array');
      results.body.concernPoints.length.should.equal(30);

      const firstChunk = results.body.concernPoints.shift();
      firstChunk.should.have.property('discreetPointIds');
      firstChunk.should.have.property('longitude');
      firstChunk.should.have.property('latitude');
      firstChunk.should.have.property('time');
      firstChunk.should.have.property('nickname');
    });

    it('and returns no points if no caseIds are passed', async () => {
      const results = await chai
        .request(server)
        .post(`/cases/points`)
        .set('Cookie', `access_token=${token}`)
        .set('content-type', 'application/json')
        .send({ caseIds: [] });

      results.error.should.be.false;
      results.should.have.status(200);
      results.body.should.be.a('object');
      results.body.should.have.property('concernPoints');
      results.body.concernPoints.should.be.a('array');
      results.body.concernPoints.length.should.equal(0);
    });

    it('and fails if caseIds are not passed', async () => {
      const results = await chai
        .request(server)
        .post(`/cases/points`)
        .set('Cookie', `access_token=${token}`)
        .set('content-type', 'application/json')
        .send();

      results.should.have.status(400);
    });
  });

  describe('add a single point on a case', () => {
    before(async () => {
      await caseService.deleteAllRows();

      const caseParams = {
        organization_id: currentOrg.id,
        state: 'published',
      };
      currentCase = await mockData.mockCase(caseParams);
    });

    it('and return the newly created point', async () => {
      const newParams = {
        caseId: currentCase.caseId,
        point: {
          longitude: 14.91328448,
          latitude: 41.24060321,
          time: '2020-05-01T18:25:43.511Z',
          duration: 5,
          nickname: 'home',
        },
      };

      const results = await chai
        .request(server)
        .post(`/case/point`)
        .set('Cookie', `access_token=${token}`)
        .set('content-type', 'application/json')
        .send(newParams);

      results.error.should.be.false;
      results.should.have.status(200);
      results.body.should.be.a('object');
      results.body.should.have.property('concernPoint');
      results.body.concernPoint.should.be.a('object');
      results.body.concernPoint.should.have.property('discreetPointIds');
      results.body.concernPoint.should.have.property('longitude');
      results.body.concernPoint.should.have.property('latitude');
      results.body.concernPoint.should.have.property('time');
      results.body.concernPoint.longitude.should.equal(
        newParams.point.longitude,
      );
      results.body.concernPoint.latitude.should.equal(newParams.point.latitude);
      results.body.concernPoint.time.should.equal(newParams.point.time);
      results.body.concernPoint.nickname.should.equal(newParams.point.nickname);
    });
  });

  describe('update a point on a case', () => {
    before(async () => {
      await caseService.deleteAllRows();
      await pointService.deleteAllRows();

      let params = {
        organization_id: currentOrg.id,
        number_of_trails: 10,
        seconds_apart: 1800,
        state: 'staging',
      };

      currentCase = await mockData.mockCaseAndTrails(
        _.extend(params, { state: 'unpublished' }),
      );
    });

    it('return a 200', async () => {
      const testPoint = currentCase.points[0];

      const newParams = {
        discreetPointIds: [ testPoint.id ],
        longitude: 12.91328448,
        latitude: 39.24060321,
        time: '2020-05-21T18:25:43.511Z',
        duration: 10,
        nickname: 'grocery store',
        caseId: currentCase.caseId
      };

      const results = await chai
        .request(server)
        .put(`/case/point`)
        .set('Cookie', `access_token=${token}`)
        .set('content-type', 'application/json')
        .send(newParams);

      results.error.should.be.false;
      results.should.have.status(200);
      results.body.should.be.a('object');
      results.body.should.have.property('concernPoint');
      results.body.concernPoint.should.be.a('object');
      results.body.concernPoint.should.have.property('discreetPointIds');
      results.body.concernPoint.should.have.property('longitude');
      results.body.concernPoint.should.have.property('latitude');
      results.body.concernPoint.should.have.property('time');
      results.body.concernPoint.should.have.property('duration');
      results.body.concernPoint.duration.should.equal(newParams.duration);
      results.body.concernPoint.longitude.should.equal(newParams.longitude);
      results.body.concernPoint.nickname.should.equal(newParams.nickname);
    });
  });

  describe('update multiple points on a case', () => {
    before(async () => {
      await caseService.deleteAllRows();
      await pointService.deleteAllRows();

      let params = {
        organization_id: currentOrg.id,
        number_of_trails: 2,
        seconds_apart: 1800,
        state: 'staging',
        nickname: 'home',
      };

      currentCase = await mockData.mockCaseAndTrails(
        _.extend(params, { state: 'unpublished' }),
      );
    });

    it('return a 200', async () => {
      const point1 = currentCase.points[0];
      const point2 = currentCase.points[1];

      const newParams = {
        pointIds: [point1.id, point2.id],
        nickname: 'grocery store',
      };

      const results = await chai
        .request(server)
        .put(`/case/points`)
        .set('Cookie', `access_token=${token}`)
        .set('content-type', 'application/json')
        .send(newParams);

      results.error.should.be.false;
      results.should.have.status(200);

      const firstChunk = results.body.concernPoints[0];
      firstChunk.nickname.should.equal(newParams.nickname);

      const secondChunk = results.body.concernPoints[1];
      secondChunk.nickname.should.equal(newParams.nickname);
    });
  });

  describe('delete a point on a case', () => {
    before(async () => {
      await caseService.deleteAllRows();
      await pointService.deleteAllRows();

      let params = {
        organization_id: currentOrg.id,
        number_of_trails: 10,
        seconds_apart: 1800,
        state: 'staging',
      };

      currentCase = await mockData.mockCaseAndTrails(
        _.extend(params, { state: 'unpublished' }),
      );
    });

    it('returns a 200', async () => {
      const testPoint = currentCase.points[0];

      const newParams = {
        pointId: testPoint.id,
      };

      const results = await chai
        .request(server)
        .post(`/case/point/delete`)
        .set('Cookie', `access_token=${token}`)
        .set('content-type', 'application/json')
        .send(newParams);

      results.should.have.status(200);
    });
  });

  describe('delete points on a case', () => {
    before(async () => {
      await caseService.deleteAllRows();

      const caseParams = {
        organization_id: currentOrg.id,
        state: 'published',
      };
      currentCase = await mockData.mockCase(caseParams);

      // Add Trails
      let trailsParams = {
        caseId: currentCase.caseId,
      };
      await mockData.mockTrails(10, 1800, trailsParams); // Generate 10 trails 30 min apart
    });

    it('fails when request is malformed', async () => {
      let results = await chai
        .request(server)
        .post(`/case/points/delete`)
        .set('Cookie', `access_token=${token}`)
        .set('content-type', 'application/json')
        .send();
      results.error.should.not.be.false;
      results.should.have.status(400);

      results = await chai
        .request(server)
        .post(`/case/points/delete`)
        .set('Cookie', `access_token=${token}`)
        .set('content-type', 'application/json')
        .send({ pointIds: 'invalid' });
      results.error.should.not.be.false;
      results.should.have.status(400);
    });

    it('deletes points', async () => {
      let points = await caseService.fetchCasePoints(currentCase.caseId);
      const initialLength = points.length;
      initialLength.should.be.greaterThan(3);

      const deletedPoints = _.sampleSize(points, 3);

      const results = await chai
        .request(server)
        .post(`/case/points/delete`)
        .set('Cookie', `access_token=${token}`)
        .set('content-type', 'application/json')
        .send({ pointIds: _.map(deletedPoints, point => point.id) });

      results.error.should.be.false;
      results.should.have.status(200);

      points = await caseService.fetchCasePoints(currentCase.caseId);
      points.length.should.equal(initialLength - deletedPoints.length);
    });
  });

});
