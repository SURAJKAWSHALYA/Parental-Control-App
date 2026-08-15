export interface ISafetyClassification {
  category: string;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
}

export interface SafetyModelProvider {
  analyzeText(text: string, context?: any): Promise<ISafetyClassification>;
  analyzeImage(imageMetadata: any): Promise<ISafetyClassification>;
}
