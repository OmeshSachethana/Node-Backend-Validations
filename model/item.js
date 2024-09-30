const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true, // Removes any extra spaces
        minlength: [3, 'Item name must be at least 3 characters long'],
        maxlength: [100, 'Item name cannot exceed 100 characters'],
        index: true // Indexing for faster querying
    },
    description: {
        type: String,
        required: [true, 'Item description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
        max: [10000, 'Price cannot exceed 10,000'],
        validate: {
            validator: Number.isInteger,
            message: 'Price must be an integer value'
        }
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Item', itemSchema);
