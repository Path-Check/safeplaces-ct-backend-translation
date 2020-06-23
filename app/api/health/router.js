const { router } = require('../../../app');
const controller = require('./controller');

router.get(
  '/health',
  router.wrapAsync(async (req, res) => await controller.health(req, res)),
);
