import React, { useState } from 'react';
import Modal from '../UI/Modal';
import { DocumentArrowDownIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { ExportService } from '../../services/export';
import { Task, Project, Team } from '../../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  type: 'tasks' | 'projects' | 'teams';
  title?: string;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  data,
  type,
  title
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  const handleExport = async () => {
    if (data.length === 0) return;

    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      
      if (exportFormat === 'csv') {
        switch (type) {
          case 'tasks':
            ExportService.exportTasksToCSV(
              data as Task[], 
              `tasks-${timestamp}.csv`
            );
            break;
          case 'projects':
            ExportService.exportProjectsToCSV(
              data as Project[], 
              `projects-${timestamp}.csv`
            );
            break;
          case 'teams':
            ExportService.exportTeamsToCSV(
              data as Team[], 
              `teams-${timestamp}.csv`
            );
            break;
        }
      } else if (exportFormat === 'pdf') {
        switch (type) {
          case 'tasks':
            ExportService.exportTasksToPDF(
              data as Task[], 
              `tasks-report-${timestamp}.pdf`
            );
            break;
          case 'projects':
            // For projects, we'll export a summary PDF
            ExportService.exportTasksToPDF(
              [], // Empty tasks for now, could be enhanced later
              `projects-report-${timestamp}.pdf`
            );
            break;
          case 'teams':
            // Teams could also have a custom PDF format
            ExportService.exportTasksToPDF(
              [], 
              `teams-report-${timestamp}.pdf`
            );
            break;
        }
      }

      onClose();
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const modalTitle = title || `Export ${type.charAt(0).toUpperCase() + type.slice(1)}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
    >
      <div className="space-y-6">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Export {data.length} {type} to your preferred format.
          </p>

          {/* Format Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`relative flex items-center justify-center p-4 border rounded-lg cursor-pointer focus:outline-none ${
                  exportFormat === 'csv'
                    ? 'border-primary-500 ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <TableCellsIcon className="h-8 w-8 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">CSV</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Spreadsheet compatible
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`relative flex items-center justify-center p-4 border rounded-lg cursor-pointer focus:outline-none ${
                  exportFormat === 'pdf'
                    ? 'border-primary-500 ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <DocumentArrowDownIcon className="h-8 w-8 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">PDF</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Formatted report
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Format Description */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {exportFormat === 'csv' ? (
                <>
                  <strong>CSV Format:</strong> Raw data export that can be opened in Excel, 
                  Google Sheets, or other spreadsheet applications. Includes all available fields.
                </>
              ) : (
                <>
                  <strong>PDF Format:</strong> Formatted report with tables and summaries. 
                  Perfect for presentations or archival purposes.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="btn-primary"
            disabled={isExporting || data.length === 0}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;