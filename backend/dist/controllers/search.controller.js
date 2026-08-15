"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalSearch = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Child_1 = require("../models/Child");
const Device_1 = require("../models/Device");
const Activity_1 = require("../models/Activity");
const SafetyEvent_1 = require("../models/SafetyEvent");
const Message_1 = require("../models/Message");
const globalSearch = async (req, res) => {
    try {
        const parentId = req.user.id;
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
        }
        const pId = new mongoose_1.default.Types.ObjectId(parentId);
        const regex = new RegExp(q, 'i');
        const results = [];
        // 1. Search Children
        const children = await Child_1.Child.find({ parentId: pId, $or: [{ firstName: regex }, { lastName: regex }] });
        children.forEach(c => results.push({ type: 'child', id: c._id, title: `${c.firstName} ${c.lastName}`, subtitle: 'Child Profile', url: `/children/${c._id}` }));
        const childIds = children.length > 0 ? children.map(c => c._id) : (await Child_1.Child.find({ parentId: pId }).select('_id')).map(c => c._id);
        // 2. Search Devices
        const devices = await Device_1.Device.find({ parentId: pId, $or: [{ name: regex }, { deviceModel: regex }] });
        devices.forEach(d => results.push({ type: 'device', id: d._id, title: d.name, subtitle: d.deviceModel || 'Device', url: `/devices` }));
        // 3. Search Activity
        const activities = await Activity_1.Activity.find({ childId: { $in: childIds }, $or: [{ title: regex }, { description: regex }] }).limit(10).sort({ timestamp: -1 });
        activities.forEach(a => results.push({ type: 'activity', id: a._id, title: a.title, subtitle: a.description, url: `/activity` }));
        // 4. Search Safety Events
        const safetyEvents = await SafetyEvent_1.SafetyEvent.find({ parentId: pId, $or: [{ title: regex }, { description: regex }, { category: regex }] }).limit(10).sort({ timestamp: -1 });
        safetyEvents.forEach(s => results.push({ type: 'safety', id: s._id, title: s.title, subtitle: s.description, url: `/alerts` }));
        // 5. Search Messages (Family Chat)
        // For Family Chat, we might want to search text if the parent is part of the conversation. 
        // Just searching messages linked to parent or children
        const messages = await Message_1.Message.find({
            $or: [{ senderId: { $in: [pId, ...childIds] } }, { receiverId: { $in: [pId, ...childIds] } }],
            content: regex
        }).limit(10).sort({ timestamp: -1 });
        messages.forEach(m => results.push({ type: 'message', id: m._id, title: 'Chat Message', subtitle: m.content?.substring(0, 50) + '...', url: `/chat` }));
        res.json({ success: true, data: results });
    }
    catch (error) {
        console.error('Error in global search:', error);
        res.status(500).json({ success: false, message: 'Server error during search' });
    }
};
exports.globalSearch = globalSearch;
