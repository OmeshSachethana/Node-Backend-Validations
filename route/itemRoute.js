const express = require('express');
const router = express.Router();
const validateItem = require('../middleware/itemValidator'); // Import correctly
const itemController = require('../controller/itemController');

router.post('/items', validateItem, itemController.createItem);
router.get('/items', itemController.getItems);
router.get('/items/:id', itemController.getItem);
router.put('/items/:id', validateItem, itemController.updateItem);
router.delete('/items/:id', itemController.deleteItem);

module.exports = router;
