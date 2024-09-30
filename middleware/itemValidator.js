const { body } = require('express-validator');

exports.validateItem = [
    body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
    body('price').isInt({ min: 0 }).withMessage('Price must be a positive integer')
];
