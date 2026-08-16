import { EventEmitter } from 'events';
import { SafetyEventService } from '../services/SafetyEventService';
import { Message } from '../models/Message';
import { MediaAsset } from '../models/MediaAsset';
import mongoose from 'mongoose';
import { runJobWithRetry } from '../utils/jobRunner';

class SafetyWorker extends EventEmitter {
  private queue: any[] = [];
  private processing = false;

  constructor() {
    super();
    this.on('new_job', this.processQueue.bind(this));
  }

  enqueueMessageAnalysis(messageId: mongoose.Types.ObjectId, parentId: mongoose.Types.ObjectId, childId: mongoose.Types.ObjectId, text: string) {
    this.queue.push({ type: 'MESSAGE', messageId, parentId, childId, text });
    this.emit('new_job');
  }

  enqueueMediaAnalysis(mediaId: mongoose.Types.ObjectId, parentId: mongoose.Types.ObjectId, childId: mongoose.Types.ObjectId, mediaType: 'IMAGE' | 'VIDEO') {
    this.queue.push({ type: 'MEDIA', mediaId, parentId, childId, mediaType });
    this.emit('new_job');
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      try {
        if (job.type === 'MESSAGE') {
          runJobWithRetry(() => this.handleMessageJob(job), {
            type: 'ai_safety_message',
            payload: job,
            maxRetries: 3
          });
        } else if (job.type === 'MEDIA') {
          runJobWithRetry(() => this.handleMediaJob(job), {
            type: 'ai_safety_media',
            payload: job,
            maxRetries: 3
          });
        }
      } catch (err) {
        console.error('SafetyWorker queue error:', err);
      }
    }

    this.processing = false;
  }

  private async handleMessageJob(job: any) {
    const { event, classification } = await SafetyEventService.processChatMessage(job.parentId, job.childId, job.text, job.messageId) as any;
    
    const status = classification.category === 'Safe' || classification.category === 'Normal' ? 'SAFE' : 
                   classification.severity === 'HIGH' || classification.severity === 'CRITICAL' ? 'FLAGGED' : 
                   classification.severity === 'MEDIUM' ? 'REVIEW' : 'UNKNOWN';

    await Message.findByIdAndUpdate(job.messageId, { safetyStatus: status });
  }

  private async handleMediaJob(job: any) {
    const { event, classification } = await SafetyEventService.processChatMedia(job.parentId, job.childId, job.mediaId, job.mediaType) as any;

    const status = !classification ? 'SAFE' :
                   classification.category === 'Safe' || classification.category === 'Normal' ? 'SAFE' : 
                   classification.severity === 'HIGH' || classification.severity === 'CRITICAL' ? 'FLAGGED' : 
                   classification.severity === 'MEDIUM' ? 'REVIEW' : 'UNKNOWN';

    await MediaAsset.findByIdAndUpdate(job.mediaId, { safetyStatus: status });
  }
}

export const safetyWorker = new SafetyWorker();
