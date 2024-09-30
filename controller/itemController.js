const Item = require('../model/item'); // Import the Item model
const { validationResult } = require('express-validator'); // Import validationResult from express-validator to handle validation errors
const createError = require('http-errors'); // Import createError to create HTTP errors
const mongoose = require('mongoose'); // Import mongoose for database interactions and transactions
const cache = require('../utils/cache');  // Import custom caching utility
const logger = require('../utils/logger'); // Import custom logging utility

// Create a new item with transaction handling
exports.createItem = async (req, res, next) => {
    const session = await mongoose.startSession(); // Start a new MongoDB session for transactions
    session.startTransaction(); // Begin a transaction
    try {
        const errors = validationResult(req); // Get validation errors from the request body
        if (!errors.isEmpty()) {
            return next(createError(400, { errors: errors.array() })); // If there are validation errors, return a 400 error with error details
        }

        const newItem = new Item(req.body); // Create a new Item instance using the request body
        await newItem.save({ session }); // Save the item to the database within the transaction

        await session.commitTransaction(); // Commit the transaction to persist the changes
        session.endSession(); // End the MongoDB session

        res.status(201).json(newItem); // Send the created item as a JSON response with a 201 status code
    } catch (error) {
        await session.abortTransaction(); // If an error occurs, abort the transaction
        session.endSession(); // End the session

        logger.error(`Failed to create item: ${error.message}`, { error }); // Log the error with a custom message

        next(createError(500, 'Internal Server Error')); // Send a 500 error response to the client
    }
};

// Read all items with flexible querying, pagination, and caching
exports.getItems = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get the page number from the query parameters, default to 1
        const limit = parseInt(req.query.limit) || 10; // Get the limit (number of items per page), default to 10
        const skip = (page - 1) * limit; // Calculate how many items to skip based on the current page
        const sort = req.query.sort || 'createdAt'; // Get the sort parameter, default to 'createdAt'
        const filters = req.query.filters ? JSON.parse(req.query.filters) : {}; // Parse filters from the query string, default to an empty object

        const cacheKey = `items_${page}_${limit}_${sort}_${JSON.stringify(filters)}`; // Generate a cache key using pagination, sorting, and filtering options
        let cachedData = await cache.get(cacheKey); // Try to retrieve cached data for the given cache key

        if (cachedData) {
            return res.status(200).json(cachedData); // If data is found in the cache, return it immediately
        }

        const items = await Item.find(filters) // Query the database for items that match the filters
            .skip(skip) // Skip the first (page-1) * limit items
            .limit(limit) // Limit the number of items retrieved to 'limit'
            .sort(sort); // Sort the items based on the 'sort' field

        const totalItems = await Item.countDocuments(filters); // Get the total number of items that match the filters

        const response = {
            items, // The list of items retrieved from the database
            pagination: {
                totalItems, // Total number of items available in the database
                totalPages: Math.ceil(totalItems / limit), // Total number of pages based on total items and limit per page
                currentPage: page // The current page number
            }
        };

        await cache.set(cacheKey, response, 60); // Cache the response data for 60 seconds

        res.status(200).json(response); // Send the items and pagination info as a JSON response
    } catch (error) {
        logger.error(`Failed to retrieve items: ${error.message}`, { error }); // Log the error
        next(createError(500, 'Internal Server Error')); // Send a 500 error response to the client
    }
};

// Read a single item with caching and detailed error handling
exports.getItem = async (req, res, next) => {
    try {
        const cacheKey = `item_${req.params.id}`; // Create a cache key based on the item's ID
        let cachedItem = await cache.get(cacheKey); // Try to retrieve the cached item

        if (cachedItem) {
            return res.status(200).json(cachedItem); // If the item is cached, return it immediately
        }

        const item = await Item.findById(req.params.id); // Find the item by its ID in the database
        if (!item) return next(createError(404, 'Item not found')); // If the item is not found, return a 404 error

        await cache.set(cacheKey, item, 60); // Cache the retrieved item for 60 seconds

        res.status(200).json(item); // Send the item as a JSON response
    } catch (error) {
        logger.error(`Failed to retrieve item: ${error.message}`, { error }); // Log the error
        next(createError(500, 'Internal Server Error')); // Send a 500 error response to the client
    }
};

// Update an item with validation, transaction handling, and logging
exports.updateItem = async (req, res, next) => {
    const session = await mongoose.startSession(); // Start a new MongoDB session for transactions
    session.startTransaction(); // Begin a transaction
    try {
        const errors = validationResult(req); // Get validation errors from the request body
        if (!errors.isEmpty()) {
            return next(createError(400, { errors: errors.array() })); // If there are validation errors, return a 400 error with error details
        }

        const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, session }); // Update the item in the database and return the new version
        if (!updatedItem) return next(createError(404, 'Item not found')); // If the item is not found, return a 404 error

        await session.commitTransaction(); // Commit the transaction to persist the changes
        session.endSession(); // End the MongoDB session

        await cache.del(`item_${req.params.id}`); // Invalidate the cache for the updated item

        res.status(200).json(updatedItem); // Send the updated item as a JSON response
    } catch (error) {
        await session.abortTransaction(); // If an error occurs, abort the transaction
        session.endSession(); // End the session

        logger.error(`Failed to update item: ${error.message}`, { error }); // Log the error

        next(createError(400, 'Failed to update item')); // Send a 400 error response to the client
    }
};

// Delete an item with transaction handling and logging
exports.deleteItem = async (req, res, next) => {
    const session = await mongoose.startSession(); // Start a new MongoDB session for transactions
    session.startTransaction(); // Begin a transaction
    try {
        const deletedItem = await Item.findByIdAndDelete(req.params.id, { session }); // Delete the item from the database
        if (!deletedItem) return next(createError(404, 'Item not found')); // If the item is not found, return a 404 error

        await session.commitTransaction(); // Commit the transaction to persist the changes
        session.endSession(); // End the MongoDB session

        await cache.del(`item_${req.params.id}`); // Invalidate the cache for the deleted item

        res.status(200).json({ message: 'Item deleted successfully' }); // Send a success message
    } catch (error) {
        await session.abortTransaction(); // If an error occurs, abort the transaction
        session.endSession(); // End the session

        logger.error(`Failed to delete item: ${error.message}`, { error }); // Log the error

        next(createError(500, 'Internal Server Error')); // Send a 500 error response to the client
    }
};
