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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsiteRule = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const WebsiteRuleSchema = new mongoose_1.Schema({
    childId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Device', required: true },
    type: { type: String, enum: ['BLOCK', 'ALLOW'], required: true },
    domain: { type: String, required: true },
    category: { type: String },
    enabled: { type: Boolean, default: true },
    reason: { type: String },
}, { timestamps: true });
// Normalize domain before saving
WebsiteRuleSchema.pre('save', function (next) {
    if (this.domain) {
        // Remove protocol, www., and trailing slashes
        let d = this.domain.toLowerCase();
        d = d.replace(/^(https?:\/\/)?(www\.)?/, '');
        d = d.split('/')[0];
        this.domain = d;
    }
    next();
});
exports.WebsiteRule = mongoose_1.default.model('WebsiteRule', WebsiteRuleSchema);
