"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = void 0;
const uuid_1 = require("uuid");
const requestIdMiddleware = (req, res, next) => {
    const reqId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    req.id = reqId;
    res.setHeader('x-request-id', reqId);
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
