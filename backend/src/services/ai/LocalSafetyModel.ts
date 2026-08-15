import { SafetyModelProvider, ISafetyClassification } from './SafetyModelProvider';

// A local heuristic model that simulates AI/ML abstraction
export class LocalSafetyModel implements SafetyModelProvider {
  
  private readonly THREAT_KEYWORDS = ['kill', 'die', 'murder', 'beat you', 'hurt you', 'destroy you', 'burn', 'stab'];
  private readonly BULLYING_KEYWORDS = ['loser', 'ugly', 'stupid', 'hate you', 'nobody likes', 'fat', 'dumb', 'kys'];
  private readonly SCAM_KEYWORDS = ['urgent', 'payment', 'bank', 'password', 'verify', 'account suspended', 'click here', 'winner', 'prize', 'transfer'];
  private readonly EXPLICIT_KEYWORDS = ['nude', 'naked', 'sex', 'porn', 'send pics', 'hookup'];
  private readonly SELF_HARM_KEYWORDS = ['cut myself', 'want to die', 'suicide', 'end it all', 'worthless'];

  async analyzeText(text: string, context?: any): Promise<ISafetyClassification> {
    if (!text) {
      return { category: 'Normal', confidence: 100, severity: 'LOW', source: 'LocalHeuristicModel' };
    }

    const lowerText = text.toLowerCase();
    
    if (this.SELF_HARM_KEYWORDS.some(kw => lowerText.includes(kw))) {
      return { category: 'Self-harm related', confidence: 90, severity: 'CRITICAL', source: 'LocalHeuristicModel' };
    }

    if (this.THREAT_KEYWORDS.some(kw => lowerText.includes(kw))) {
      return { category: 'Threat', confidence: 85, severity: 'HIGH', source: 'LocalHeuristicModel' };
    }

    if (this.EXPLICIT_KEYWORDS.some(kw => lowerText.includes(kw))) {
      return { category: 'Explicit Content Indicator', confidence: 80, severity: 'HIGH', source: 'LocalHeuristicModel' };
    }

    if (this.BULLYING_KEYWORDS.some(kw => lowerText.includes(kw))) {
      return { category: 'Bullying', confidence: 60, severity: 'MEDIUM', source: 'LocalHeuristicModel' };
    }

    if (this.SCAM_KEYWORDS.some(kw => lowerText.includes(kw))) {
      return { category: 'Scam Indicator', confidence: 75, severity: 'MEDIUM', source: 'LocalHeuristicModel' };
    }

    const genericHarmful = ['danger', 'secret', 'don\'t tell'];
    if (genericHarmful.some(kw => lowerText.includes(kw))) {
      return { category: 'Potentially Harmful', confidence: 40, severity: 'LOW', source: 'LocalHeuristicModel' };
    }

    return { category: 'Normal', confidence: 95, severity: 'LOW', source: 'LocalHeuristicModel' };
  }

  async analyzeImage(imageMetadata: any): Promise<ISafetyClassification> {
    // Mock image analysis based on filename or fake tags
    const filename = imageMetadata?.filename?.toLowerCase() || '';
    if (filename.includes('nsfw') || filename.includes('nude')) {
      return { category: 'Potentially Explicit', confidence: 85, severity: 'HIGH', source: 'LocalHeuristicModel' };
    }
    if (filename.includes('gun') || filename.includes('blood')) {
      return { category: 'Violence', confidence: 75, severity: 'HIGH', source: 'LocalHeuristicModel' };
    }
    return { category: 'Safe', confidence: 90, severity: 'LOW', source: 'LocalHeuristicModel' };
  }
}
