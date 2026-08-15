"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAlertRule = exports.getAlertRules = void 0;
const AlertRule_1 = require("../models/AlertRule");
const getAlertRules = async (req, res) => {
    try {
        const { childId } = req.params;
        // Find child specific rules and global rules (childId = null) for this parent
        const rules = await AlertRule_1.AlertRule.find({
            parentId: req.user?._id,
            $or: [{ childId }, { childId: { $exists: false } }]
        });
        res.json({ success: true, data: rules });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getAlertRules = getAlertRules;
const updateAlertRule = async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled, cooldownMinutes, quietHours } = req.body;
        const rule = await AlertRule_1.AlertRule.findOneAndUpdate({ _id: id, parentId: req.user?._id }, { enabled, cooldownMinutes, quietHours }, { new: true, runValidators: true });
        if (!rule) {
            return res.status(404).json({ success: false, error: 'Alert rule not found' });
        }
        res.json({ success: true, data: rule });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.updateAlertRule = updateAlertRule;
