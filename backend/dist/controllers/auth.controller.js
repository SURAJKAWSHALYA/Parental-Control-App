"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getMe = exports.login = exports.register = void 0;
const Parent_1 = require("../models/Parent");
const auth_service_1 = require("../services/auth.service");
const response_1 = require("../utils/response");
const register = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        const userExists = await Parent_1.Parent.findOne({ email });
        if (userExists) {
            return (0, response_1.sendError)(res, 'User already exists', 'USER_EXISTS', 400);
        }
        const passwordHash = await (0, auth_service_1.hashPassword)(password);
        const parent = await Parent_1.Parent.create({
            fullName,
            email,
            passwordHash,
        });
        if (parent) {
            (0, response_1.sendSuccess)(res, {
                _id: parent._id,
                fullName: parent.fullName,
                email: parent.email,
                token: (0, auth_service_1.generateToken)(String(parent._id)),
            }, 'Registration successful', 201);
        }
        else {
            (0, response_1.sendError)(res, 'Invalid user data', 'INVALID_DATA', 400);
        }
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message, 'SERVER_ERROR', 500);
    }
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const parent = await Parent_1.Parent.findOne({ email });
        if (parent && (await (0, auth_service_1.matchPassword)(password, parent.passwordHash))) {
            (0, response_1.sendSuccess)(res, {
                _id: parent._id,
                fullName: parent.fullName,
                email: parent.email,
                token: (0, auth_service_1.generateToken)(String(parent._id)),
            }, 'Login successful');
        }
        else {
            (0, response_1.sendError)(res, 'Invalid email or password', 'INVALID_CREDENTIALS', 401);
        }
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message, 'SERVER_ERROR', 500);
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const parent = await Parent_1.Parent.findById(req.user._id).select('-passwordHash');
        if (parent) {
            (0, response_1.sendSuccess)(res, parent, 'User fetched successfully');
        }
        else {
            (0, response_1.sendError)(res, 'User not found', 'NOT_FOUND', 404);
        }
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message, 'SERVER_ERROR', 500);
    }
};
exports.getMe = getMe;
const logout = async (req, res) => {
    // Since we use JWT, logout is primarily handled on the client by destroying the token
    // A robust approach might involve a token blacklist in Redis, but for Phase 1:
    (0, response_1.sendSuccess)(res, {}, 'Logout successful');
};
exports.logout = logout;
