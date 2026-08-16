import { v4 as uuidv4 } from 'uuid';
import FailedJob from '../models/FailedJob';

interface JobOptions {
  type: string;
  payload: any;
  maxRetries?: number;
  baseBackoffMs?: number;
}

export const runJobWithRetry = async (
  jobFunction: () => Promise<void>,
  options: JobOptions
) => {
  const jobId = uuidv4();
  const maxRetries = options.maxRetries || 3;
  const baseBackoffMs = options.baseBackoffMs || 1000;
  
  let attempts = 0;

  const execute = async () => {
    attempts++;
    try {
      await jobFunction();
    } catch (error: any) {
      console.error(`Job ${options.type} (${jobId}) failed on attempt ${attempts}:`, error);

      if (attempts < maxRetries) {
        // Exponential backoff
        const backoff = baseBackoffMs * Math.pow(2, attempts - 1);
        console.log(`Retrying job ${options.type} (${jobId}) in ${backoff}ms...`);
        
        setTimeout(() => {
          execute().catch(e => console.error('Uncaught error in retry timeout:', e));
        }, backoff);
      } else {
        console.error(`Job ${options.type} (${jobId}) reached max retries. Moving to DLQ.`);
        try {
          await FailedJob.create({
            jobId,
            type: options.type,
            payload: options.payload,
            error: error.message || String(error),
            attempts,
            status: 'dead_letter',
            failedAt: new Date()
          });
        } catch (dbError) {
          console.error(`Failed to save dead letter for job ${options.type} (${jobId}):`, dbError);
        }
      }
    }
  };

  // Start the first execution
  execute().catch(e => console.error('Uncaught error in initial job execution:', e));
};
