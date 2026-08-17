"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safetyWorker = void 0;
const events_1 = require("events");
const SafetyEventService_1 = require("../services/SafetyEventService");
const Message_1 = require("../models/Message");
const MediaAsset_1 = require("../models/MediaAsset");
const jobRunner_1 = require("../utils/jobRunner");
class SafetyWorker extends events_1.EventEmitter {
    queue = [];
    processing = false;
    constructor() {
        super();
        this.on('new_job', this.processQueue.bind(this));
    }
    enqueueMessageAnalysis(messageId, parentId, childId, text) {
        this.queue.push({ type: 'MESSAGE', messageId, parentId, childId, text });
        this.emit('new_job');
    }
    enqueueMediaAnalysis(mediaId, parentId, childId, mediaType) {
        this.queue.push({ type: 'MEDIA', mediaId, parentId, childId, mediaType });
        this.emit('new_job');
    }
    async processQueue() {
        if (this.processing || this.queue.length === 0)
            return;
        this.processing = true;
        while (this.queue.length > 0) {
            const job = this.queue.shift();
            try {
                if (job.type === 'MESSAGE') {
                    (0, jobRunner_1.runJobWithRetry)(() => this.handleMessageJob(job), {
                        type: 'ai_safety_message',
                        payload: job,
                        maxRetries: 3
                    });
                }
                else if (job.type === 'MEDIA') {
                    (0, jobRunner_1.runJobWithRetry)(() => this.handleMediaJob(job), {
                        type: 'ai_safety_media',
                        payload: job,
                        maxRetries: 3
                    });
                }
            }
            catch (err) {
                console.error('SafetyWorker queue error:', err);
            }
        }
        this.processing = false;
    }
    async handleMessageJob(job) {
        const { event, classification } = await SafetyEventService_1.SafetyEventService.processChatMessage(job.parentId, job.childId, job.text, job.messageId);
        const status = classification.category === 'Safe' || classification.category === 'Normal' ? 'SAFE' :
            classification.severity === 'HIGH' || classification.severity === 'CRITICAL' ? 'FLAGGED' :
                classification.severity === 'MEDIUM' ? 'REVIEW' : 'UNKNOWN';
        await Message_1.Message.findByIdAndUpdate(job.messageId, { safetyStatus: status });
    }
    async handleMediaJob(job) {
        const { event, classification } = await SafetyEventService_1.SafetyEventService.processChatMedia(job.parentId, job.childId, job.mediaId, job.mediaType);
        const status = !classification ? 'SAFE' :
            classification.category === 'Safe' || classification.category === 'Normal' ? 'SAFE' :
                classification.severity === 'HIGH' || classification.severity === 'CRITICAL' ? 'FLAGGED' :
                    classification.severity === 'MEDIUM' ? 'REVIEW' : 'UNKNOWN';
        await MediaAsset_1.MediaAsset.findByIdAndUpdate(job.mediaId, { safetyStatus: status });
    }
}
exports.safetyWorker = new SafetyWorker();
