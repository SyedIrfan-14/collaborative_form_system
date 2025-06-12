const express = require('express');
const router = express.Router();
const { createForm, getFormByCode } = require('../controllers/formController');
const { authenticate } = require('../middleware/auth');

router.post('/forms', authenticate, createForm);
router.get('/forms/:code', getFormByCode);

module.exports = router;