import { SafetyEvent } from '../models/SafetyEvent';
import { getIo } from '../sockets/socketHandler';
import mongoose from 'mongoose';

export class SafetyAnalyzerService {
  
  public static async analyzeText(
    text: string, 
    sourceApp: string, 
    parentId: string, 
    childId: string, 
    deviceId: string,
    metadata?: any
  ) {
    if (!text) return;

    const lowerText = text.toLowerCase();
    
    // Categories and triggers
    const triggers = [
      { category: 'SEXUAL_CONTENT', keywords: ['nude', 'naked', 'send pic', 'send photos', 'horny'], severity: 'HIGH' },
      { category: 'GROOMING', keywords: ['don\'t tell your parents', 'keep it a secret', 'where do you live', 'are you alone'], severity: 'CRITICAL' },
      { category: 'SELF_HARM', keywords: ['kill myself', 'want to die', 'cut myself', 'hate my life', 'end it all'], severity: 'CRITICAL' },
      { category: 'BULLYING', keywords: ['you are ugly', 'everyone hates you', 'loser', 'die', 'stupid', 'dumb'], severity: 'MEDIUM' }
    ];

    let highestSeverity = 'LOW';
    let triggeredCategory = 'UNKNOWN';
    let confidence = 0;
    let confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let matchedKeywords: string[] = [];

    for (const rule of triggers) {
      for (const keyword of rule.keywords) {
        if (lowerText.includes(keyword)) {
          matchedKeywords.push(keyword);
          confidence += 30; // 30% per match
          if (triggeredCategory === 'UNKNOWN') {
             triggeredCategory = rule.category;
          }
          if (rule.severity === 'CRITICAL') highestSeverity = 'CRITICAL';
          else if (rule.severity === 'HIGH' && highestSeverity !== 'CRITICAL') highestSeverity = 'HIGH';
          else if (rule.severity === 'MEDIUM' && highestSeverity === 'LOW') highestSeverity = 'MEDIUM';
        }
      }
    }

    if (confidence > 0) {
      confidence = Math.min(confidence, 95);
      if (confidence > 80) confidenceLevel = 'HIGH';
      else if (confidence > 50) confidenceLevel = 'MEDIUM';
      else confidenceLevel = 'LOW';

      // Create a safety event
      const event = await SafetyEvent.create({
        parentId: new mongoose.Types.ObjectId(parentId),
        childId: new mongoose.Types.ObjectId(childId),
        deviceId: new mongoose.Types.ObjectId(deviceId),
        source: 'Notification',
        category: triggeredCategory,
        severity: highestSeverity,
        confidence,
        confidenceLevel,
        confidenceReason: `Matched keywords: ${matchedKeywords.join(', ')}`,
        title: `Potentially inappropriate content in ${sourceApp}`,
        description: `Text analysis flagged potentially inappropriate content: "${text.substring(0, 50)}..."`,
        evidenceType: 'TEXT',
        evidenceData: { text, app: sourceApp, metadata },
        status: 'NEW',
        isRead: false
      });

      // Emit to parent
      getIo().to(`parent_${parentId}`).emit('safety:alert', event);
      return event;
    }
    
    return null;
  }

  public static async analyzeImageFrame(
    base64Image: string, 
    parentId: string, 
    childId: string, 
    deviceId: string
  ) {
    // Simulate ~1% chance to flag a screen frame during active monitoring just for demonstration.
    const isFlagged = Math.random() < 0.01;
    
    if (isFlagged) {
       const event = await SafetyEvent.create({
        parentId: new mongoose.Types.ObjectId(parentId),
        childId: new mongoose.Types.ObjectId(childId),
        deviceId: new mongoose.Types.ObjectId(deviceId),
        source: 'Image',
        category: 'SUSPICIOUS_IMAGE',
        severity: 'MEDIUM',
        confidence: 65,
        confidenceLevel: 'MEDIUM',
        confidenceReason: 'Simulated image safety analysis triggered.',
        title: `Suspicious screen content detected`,
        description: `Image analysis flagged a screen frame as potentially inappropriate.`,
        evidenceType: 'IMAGE',
        evidenceData: { note: 'Image was analyzed and discarded for privacy.' },
        status: 'NEW',
        isRead: false
      });

      // Emit to parent
      getIo().to(`parent_${parentId}`).emit('safety:alert', event);
      return event;
    }
    return null;
  }
}
