"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportWorker = exports.ReportWorker = void 0;
const ReportRequest_1 = require("../models/ReportRequest");
const AnalyticsService_1 = require("../services/AnalyticsService");
const storage_service_1 = require("../services/storage.service");
class ReportWorker {
    isProcessing = false;
    constructor() {
        // Poll every 30 seconds for pending reports
        setInterval(() => this.processPendingReports(), 30 * 1000);
    }
    async enqueueReport(familyId, requesterId, type, format, dateRange, filters) {
        const report = await ReportRequest_1.ReportRequest.create({
            familyId,
            requesterId,
            type,
            format,
            dateRange,
            filters,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiration
        });
        // Trigger processing immediately in background
        setTimeout(() => this.processPendingReports(), 100);
        return report;
    }
    async processPendingReports() {
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        try {
            const pendingReport = await ReportRequest_1.ReportRequest.findOneAndUpdate({ status: 'PENDING' }, { status: 'PROCESSING' }, { sort: { createdAt: 1 }, new: true });
            if (!pendingReport) {
                this.isProcessing = false;
                return;
            }
            await this.generateReport(pendingReport);
            // Recursive call to process next if any
            this.isProcessing = false;
            this.processPendingReports();
        }
        catch (error) {
            console.error('ReportWorker Error:', error);
            this.isProcessing = false;
        }
    }
    async generateReport(report) {
        try {
            const familyIdStr = report.familyId.toString();
            // Fetch data
            const summary = await AnalyticsService_1.AnalyticsService.getFamilySummary(familyIdStr);
            const insights = await AnalyticsService_1.AnalyticsService.getFamilyInsights(familyIdStr);
            let fileBuffer;
            let contentType = 'application/octet-stream';
            let extension = '.txt';
            // Very simple PDF/CSV generator Mock since we don't have pdfkit/puppeteer installed natively
            // In production, this would use a real PDF library.
            if (report.format === 'CSV') {
                const csvContent = [
                    'Report Type,Date Range,Children Count,Devices Count,Safety Alerts,Screen Time',
                    `${report.type},${report.dateRange?.start?.toISOString() || 'N/A'} - ${report.dateRange?.end?.toISOString() || 'N/A'},${summary.childrenCount},${summary.devicesCount},${summary.safetyAlerts},${summary.screenTime}`,
                    '',
                    'Child Name,Screen Time,Apps Used,Websites Blocked,Safety Events',
                    ...insights.map((i) => `${i.name},${i.screenTime},${i.appsUsedCount},${i.websitesBlocked},${i.safetyEvents}`)
                ].join('\n');
                fileBuffer = Buffer.from(csvContent, 'utf-8');
                contentType = 'text/csv';
                extension = '.csv';
            }
            else {
                // PDF fallback (using a simple HTML/text representation as buffer for this demo)
                const pdfLikeContent = `
          FAMILY SAFETY REPORT (${report.type})
          =================================
          Total Children: ${summary.childrenCount}
          Total Devices: ${summary.devicesCount}
          Total Screen Time: ${summary.screenTime}
          Safety Alerts: ${summary.safetyAlerts}
          
          Insights:
          ${insights.map((i) => `- ${i.name}: ${i.screenTime} screen time, ${i.websitesBlocked} blocks`).join('\n')}
        `;
                fileBuffer = Buffer.from(pdfLikeContent, 'utf-8');
                contentType = 'application/pdf'; // Mock MIME type
                extension = '.pdf';
            }
            // Save to storage
            const storageKey = await storage_service_1.StorageService.uploadFile(fileBuffer, extension);
            report.downloadUrl = `/api/reports/download/${report._id}`;
            report.status = 'COMPLETED';
            // Store actual storage key somewhere, we can put it in errorMessage/metadata or create a new field
            // For now, let's append it to a field or just rely on the API to map ID to ReportRequest and fetch storageKey
            // Wait, ReportRequest needs to store the storageKey. Let's update the model via mongoose directly or add a field.
            report.storageKey = storageKey;
            await report.save();
        }
        catch (error) {
            report.status = 'FAILED';
            report.errorMessage = error.message;
            await report.save();
        }
    }
}
exports.ReportWorker = ReportWorker;
exports.reportWorker = new ReportWorker();
