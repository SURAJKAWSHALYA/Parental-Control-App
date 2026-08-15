import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { reportWorker } from '../workers/ReportWorker';
import { ReportRequest } from '../models/ReportRequest';
import { StorageService } from '../services/storage.service';

export const requestReport = async (req: AuthRequest, res: Response) => {
  try {
    const familyId = req.user.familyId;
    const requesterId = req.user._id;
    const { type, format, dateRange, filters } = req.body;

    if (!type || !format) {
      return sendError(res, 'Type and format are required', 'VALIDATION_ERROR', 400);
    }

    const report = await reportWorker.enqueueReport(
      familyId.toString(),
      requesterId.toString(),
      type,
      format,
      dateRange,
      filters
    );

    sendSuccess(res, report, 'Report generation started');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getReportStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const report = await ReportRequest.findById(id);

    if (!report || report.familyId.toString() !== req.user.familyId.toString()) {
      return sendError(res, 'Report not found', 'NOT_FOUND', 404);
    }

    sendSuccess(res, report, 'Report status retrieved');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getReportList = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await ReportRequest.find({ familyId: req.user.familyId })
      .sort({ createdAt: -1 })
      .limit(20);
      
    sendSuccess(res, reports, 'Reports retrieved');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const downloadReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const report = await ReportRequest.findById(id);

    if (!report || report.familyId.toString() !== req.user.familyId.toString()) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    if (report.status !== 'COMPLETED' || !report.storageKey) {
      res.status(400).json({ success: false, message: 'Report is not ready' });
      return;
    }

    const contentType = report.format === 'PDF' ? 'application/pdf' : 'text/csv';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="family-report-${report.type}.${report.format.toLowerCase()}"`);
    
    const readStream = StorageService.getFileStream(report.storageKey);
    readStream.pipe(res);
  } catch (error: any) {
    console.error('Report download error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
