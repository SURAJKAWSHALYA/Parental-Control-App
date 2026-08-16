"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFamilyData = exports.updatePermissions = exports.getFamilyMembers = exports.inviteCoParent = void 0;
const response_1 = require("../utils/response");
const Parent_1 = require("../models/Parent");
const AuditService_1 = require("../services/AuditService");
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
// Invite a Co-Parent
const inviteCoParent = async (req, res) => {
    try {
        const { email, fullName, permissions } = req.body;
        const ownerId = req.user.familyId; // Since req.user is OWNER, familyId === _id
        if (req.user.role !== 'OWNER') {
            return (0, response_1.sendError)(res, 'Only the family owner can invite co-parents', 'FORBIDDEN', 403);
        }
        // Create an account with a randomly generated secure password.
        // In a full production system with email, send a reset link instead.
        const existingUser = await Parent_1.Parent.findOne({ email });
        if (existingUser) {
            return (0, response_1.sendError)(res, 'User already exists', 'CONFLICT', 409);
        }
        const generatedPassword = crypto_1.default.randomBytes(12).toString('hex');
        const salt = await bcrypt_1.default.genSalt(10);
        const passwordHash = await bcrypt_1.default.hash(generatedPassword, salt);
        const coParent = await Parent_1.Parent.create({
            email,
            fullName,
            passwordHash,
            familyId: ownerId,
            role: 'CO_PARENT',
            permissions: permissions || ['VIEW_ONLY']
        });
        await AuditService_1.AuditService.logAction(ownerId, req.user.id, req.user.role, 'INVITE_CO_PARENT', 'Parent', coParent._id.toString(), { email, permissions }, req.ip);
        // Return the generated password ONCE so the owner can share it securely.
        (0, response_1.sendSuccess)(res, { id: coParent._id, email: coParent.email, role: coParent.role, temporaryPassword: generatedPassword }, 'Co-parent invited successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.inviteCoParent = inviteCoParent;
// List Family Members
const getFamilyMembers = async (req, res) => {
    try {
        const familyId = req.user.familyId;
        const members = await Parent_1.Parent.find({
            $or: [{ _id: familyId }, { familyId: familyId }]
        }).select('-passwordHash');
        (0, response_1.sendSuccess)(res, members, 'Family members retrieved');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getFamilyMembers = getFamilyMembers;
// Update Permissions
const updatePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;
        if (req.user.role !== 'OWNER') {
            return (0, response_1.sendError)(res, 'Only the family owner can update permissions', 'FORBIDDEN', 403);
        }
        const member = await Parent_1.Parent.findOne({ _id: id, familyId: req.user.familyId, role: 'CO_PARENT' });
        if (!member) {
            return (0, response_1.sendError)(res, 'Co-parent not found', 'NOT_FOUND', 404);
        }
        member.permissions = permissions;
        await member.save();
        await AuditService_1.AuditService.logAction(req.user.familyId, req.user.id, req.user.role, 'UPDATE_PERMISSIONS', 'Parent', member._id.toString(), { newPermissions: permissions }, req.ip);
        (0, response_1.sendSuccess)(res, member, 'Permissions updated successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.updatePermissions = updatePermissions;
// Data Deletion
const deleteFamilyData = async (req, res) => {
    try {
        if (req.user.role !== 'OWNER') {
            return (0, response_1.sendError)(res, 'Only the family owner can delete family data', 'FORBIDDEN', 403);
        }
        const familyId = req.user.familyId;
        // TODO: Verify 2FA code or password here before deletion
        // Currently proceeding without 2FA for initial version.
        // Deleting all family data
        const { Child } = await Promise.resolve().then(() => __importStar(require('../models/Child')));
        const { Device } = await Promise.resolve().then(() => __importStar(require('../models/Device')));
        const { Activity } = await Promise.resolve().then(() => __importStar(require('../models/Activity')));
        const { MediaAsset } = await Promise.resolve().then(() => __importStar(require('../models/MediaAsset')));
        const children = await Child.find({ parentId: familyId }).select('_id');
        const childIds = children.map(c => c._id);
        await Activity.deleteMany({ childId: { $in: childIds } });
        await MediaAsset.deleteMany({ familyId });
        await Device.deleteMany({ childId: { $in: childIds } });
        await Child.deleteMany({ parentId: familyId });
        // And so on for other collections...
        await AuditService_1.AuditService.logAction(familyId, req.user.id, req.user.role, 'DELETE_FAMILY_DATA', 'Family', familyId, {}, req.ip);
        (0, response_1.sendSuccess)(res, {}, 'Family data scheduled for deletion');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.deleteFamilyData = deleteFamilyData;
