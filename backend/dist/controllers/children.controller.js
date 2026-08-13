"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChild = exports.updateChild = exports.getChild = exports.addChild = exports.getChildren = void 0;
const Child_1 = require("../models/Child");
const Device_1 = require("../models/Device");
const response_1 = require("../utils/response");
const getChildren = async (req, res) => {
    try {
        const children = await Child_1.Child.find({ parentId: req.user._id });
        (0, response_1.sendSuccess)(res, children, 'Children fetched successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getChildren = getChildren;
const addChild = async (req, res) => {
    try {
        const { name, dateOfBirth, avatar } = req.body;
        if (!name || !dateOfBirth) {
            return (0, response_1.sendError)(res, 'Name and Date of Birth are required', 'VALIDATION_ERROR', 400);
        }
        const child = await Child_1.Child.create({
            parentId: req.user._id,
            name,
            dateOfBirth,
            avatar: avatar || '',
        });
        (0, response_1.sendSuccess)(res, child, 'Child added successfully', 201);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.addChild = addChild;
const getChild = async (req, res) => {
    try {
        const child = await Child_1.Child.findOne({ _id: req.params.id, parentId: req.user._id });
        if (!child)
            return (0, response_1.sendError)(res, 'Child not found', 'NOT_FOUND', 404);
        (0, response_1.sendSuccess)(res, child, 'Child fetched successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getChild = getChild;
const updateChild = async (req, res) => {
    try {
        const { name, dateOfBirth, avatar } = req.body;
        const child = await Child_1.Child.findOneAndUpdate({ _id: req.params.id, parentId: req.user._id }, { name, dateOfBirth, avatar }, { new: true, runValidators: true });
        if (!child)
            return (0, response_1.sendError)(res, 'Child not found', 'NOT_FOUND', 404);
        (0, response_1.sendSuccess)(res, child, 'Child updated successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.updateChild = updateChild;
const deleteChild = async (req, res) => {
    try {
        const child = await Child_1.Child.findOneAndDelete({ _id: req.params.id, parentId: req.user._id });
        if (!child)
            return (0, response_1.sendError)(res, 'Child not found', 'NOT_FOUND', 404);
        // Delete associated devices
        await Device_1.Device.deleteMany({ childId: child._id });
        // Should also delete associated PairingCodes, Activity, etc., in the future.
        (0, response_1.sendSuccess)(res, {}, 'Child deleted successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.deleteChild = deleteChild;
