"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadReport = exports.getReportList = exports.getReportStatus = exports.requestReport = void 0;
const response_1 = require("../utils/response");
const ReportWorker_1 = require("../workers/ReportWorker");
const ReportRequest_1 = require("../models/ReportRequest");
const storage_service_1 = require("../services/storage.service");
const requestReport = async (req, res) => {
    try {
        const familyId = req.user.familyId;
        const requesterId = req.user._id;
        const { type, format, dateRange, filters } = req.body;
        if (!type || !format) {
            return (0, response_1.sendError)(res, 'Type and format are required', 'VALIDATION_ERROR', 400);
        }
        const report = await ReportWorker_1.reportWorker.enqueueReport(familyId.toString(), requesterId.toString(), type, format, dateRange, filters);
        (0, response_1.sendSuccess)(res, report, 'Report generation started');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.requestReport = requestReport;
const getReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await ReportRequest_1.ReportRequest.findById(id);
        if (!report || report.familyId.toString() !== req.user.familyId.toString()) {
            return (0, response_1.sendError)(res, 'Report not found', 'NOT_FOUND', 404);
        }
        (0, response_1.sendSuccess)(res, report, 'Report status retrieved');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getReportStatus = getReportStatus;
const getReportList = async (req, res) => {
    try {
        const reports = await ReportRequest_1.ReportRequest.find({ familyId: req.user.familyId })
            .sort({ createdAt: -1 })
            .limit(20);
        (0, response_1.sendSuccess)(res, reports, 'Reports retrieved');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getReportList = getReportList;
const downloadReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await ReportRequest_1.ReportRequest.findById(id);
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
        const readStream = storage_service_1.StorageService.getFileStream(report.storageKey);
        readStream.pipe(res);
    }
    catch (error) {
        console.error('Report download error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.downloadReport = downloadReport;
