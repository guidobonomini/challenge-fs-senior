import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Task, Project, Team } from '../types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export class ExportService {
  // CSV Export Functions
  static exportTasksToCSV(tasks: Task[], filename: string = 'tasks.csv') {
    const headers = [
      'ID', 'Title', 'Description', 'Status', 'Priority',
      'Assignee', 'Reporter', 'Project', 'Estimated Hours', 'Actual Hours',
      'Due Date', 'Created At', 'Updated At'
    ];

    const rows = tasks.map(task => [
      task.id,
      task.title,
      task.description || '',
      task.status,
      task.priority,
      task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : '',
      task.reporter ? `${task.reporter.first_name} ${task.reporter.last_name}` : '',
      task.project_name || '',
      task.estimated_hours?.toString() || '',
      task.actual_hours?.toString() || '',
      task.due_date ? new Date(task.due_date).toLocaleDateString() : '',
      new Date(task.created_at).toLocaleDateString(),
      new Date(task.updated_at).toLocaleDateString()
    ]);

    this.downloadCSV([headers, ...rows], filename);
  }

  static exportProjectsToCSV(projects: Project[], filename: string = 'projects.csv') {
    const headers = [
      'ID', 'Name', 'Description', 'Status', 'Priority', 'Team',
      'Progress (%)', 'Start Date', 'Due Date', 'Created At', 'Updated At'
    ];

    const rows = projects.map(project => [
      project.id,
      project.name,
      project.description || '',
      project.status,
      project.priority,
      project.team_name || '',
      project.progress.toString(),
      project.start_date ? new Date(project.start_date).toLocaleDateString() : '',
      project.due_date ? new Date(project.due_date).toLocaleDateString() : '',
      new Date(project.created_at).toLocaleDateString(),
      new Date(project.updated_at).toLocaleDateString()
    ]);

    this.downloadCSV([headers, ...rows], filename);
  }

  static exportTeamsToCSV(teams: Team[], filename: string = 'teams.csv') {
    const headers = [
      'ID', 'Name', 'Description', 'Owner ID', 'Member Count',
      'Is Active', 'Created At', 'Updated At'
    ];

    const rows = teams.map(team => [
      team.id,
      team.name,
      team.description || '',
      team.owner_id,
      (team.members?.length || 0).toString(),
      team.is_active ? 'Yes' : 'No',
      new Date(team.created_at).toLocaleDateString(),
      new Date(team.updated_at).toLocaleDateString()
    ]);

    this.downloadCSV([headers, ...rows], filename);
  }

  // PDF Export Functions
  static exportTasksToPDF(tasks: Task[], filename: string = 'tasks-report.pdf') {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text('Tasks Report', 20, 20);

    // Add metadata
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Total Tasks: ${tasks.length}`, 20, 45);

    // Add tasks table
    const headers = [['Title', 'Status', 'Priority', 'Assignee', 'Due Date']];
    const rows = tasks.map(task => [
      task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title,
      task.status,
      task.priority,
      task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : 'Unassigned',
      task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 60,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Add summary by status
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let yPosition = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.text('Summary by Status:', 20, yPosition);

    yPosition += 15;
    doc.setFontSize(10);
    Object.entries(statusCounts).forEach(([status, count]) => {
      doc.text(`${status}: ${count}`, 30, yPosition);
      yPosition += 10;
    });

    doc.save(filename);
  }

  static exportProjectReportToPDF(project: Project, tasks: Task[], filename?: string) {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text(`Project Report: ${project.name}`, 20, 20);

    // Add project details
    doc.setFontSize(12);
    let yPos = 40;
    doc.text(`Status: ${project.status}`, 20, yPos);
    yPos += 10;
    doc.text(`Priority: ${project.priority}`, 20, yPos);
    yPos += 10;
    doc.text(`Progress: ${project.progress}%`, 20, yPos);
    yPos += 10;
    doc.text(`Team: ${project.team_name || 'Not assigned'}`, 20, yPos);
    yPos += 10;
    if (project.start_date) {
      doc.text(`Start Date: ${new Date(project.start_date).toLocaleDateString()}`, 20, yPos);
      yPos += 10;
    }
    if (project.due_date) {
      doc.text(`Due Date: ${new Date(project.due_date).toLocaleDateString()}`, 20, yPos);
      yPos += 10;
    }

    if (project.description) {
      yPos += 5;
      doc.text('Description:', 20, yPos);
      yPos += 10;
      const splitDescription = doc.splitTextToSize(project.description, 170);
      doc.text(splitDescription, 20, yPos);
      yPos += splitDescription.length * 5 + 10;
    }

    // Add tasks summary
    yPos += 10;
    doc.setFontSize(14);
    doc.text('Tasks Summary:', 20, yPos);
    yPos += 15;

    if (tasks.length > 0) {
      const headers = [['Title', 'Status', 'Priority', 'Assignee']];
      const rows = tasks.map(task => [
        task.title.length > 40 ? task.title.substring(0, 40) + '...' : task.title,
        task.status,
        task.priority,
        task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : 'Unassigned'
      ]);

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: yPos,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
      });
    } else {
      doc.setFontSize(10);
      doc.text('No tasks found for this project.', 20, yPos);
    }

    const finalFilename = filename || `project-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}-report.pdf`;
    doc.save(finalFilename);
  }

  // Helper function to download CSV
  private static downloadCSV(data: string[][], filename: string) {
    const csvContent = data
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}