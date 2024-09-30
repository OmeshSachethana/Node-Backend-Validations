const Item = require('../model/item');
const { validationResult } = require('express-validator');
const createError = require('http-errors');

// Create a new item
exports.createItem = async (req, res, next) => {
    try {
        // Validate request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(createError(400, { errors: errors.array() }));
        }

        const newItem = new Item(req.body);
        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        next(createError(500, error.message));
    }
};

// Read all items with pagination
exports.getItems = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const items = await Item.find().skip(skip).limit(limit);
        const totalItems = await Item.countDocuments();

        res.status(200).json({
            items,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page
            }
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};

// Read a single item
exports.getItem = async (req, res, next) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return next(createError(404, 'Item not found'));

        res.status(200).json(item);
    } catch (error) {
        next(createError(500, error.message));
    }
};

// Update an item
exports.updateItem = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(createError(400, { errors: errors.array() }));
        }

        const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedItem) return next(createError(404, 'Item not found'));

        res.status(200).json(updatedItem);
    } catch (error) {
        next(createError(400, error.message));
    }
};

// Delete an item
exports.deleteItem = async (req, res, next) => {
    try {
        const deletedItem = await Item.findByIdAndDelete(req.params.id);
        if (!deletedItem) return next(createError(404, 'Item not found'));

        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        next(createError(500, error.message));
    }
};
