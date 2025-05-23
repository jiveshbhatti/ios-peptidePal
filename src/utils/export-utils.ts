import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { Peptide } from '../types/peptide';

interface ExportOptions {
  peptides: Peptide[];
  dateRange: { start: Date; end: Date };
  selectedPeptideId?: string;
}

export async function exportDoseHistoryAsCSV(options: ExportOptions): Promise<void> {
  const { peptides, dateRange, selectedPeptideId } = options;
  
  // Filter peptides based on selection
  const peptidesToExport = selectedPeptideId 
    ? peptides.filter(p => p.id === selectedPeptideId)
    : peptides;
  
  // Create CSV header
  const headers = ['Date', 'Time', 'Peptide', 'Dosage', 'Unit', 'Volume (units)', 'Notes'];
  const rows = [headers.join(',')];
  
  // Process each peptide
  peptidesToExport.forEach(peptide => {
    peptide.doseLogs?.forEach(log => {
      const logDate = new Date(log.date);
      
      // Check if log is within date range
      if (logDate >= dateRange.start && logDate <= dateRange.end) {
        const activeVial = peptide.vials?.find(v => v.id === log.vialId);
        const volumeDrawn = log.dosageValue && activeVial?.concentration
          ? (log.dosageValue / activeVial.concentration * 100).toFixed(1)
          : '';
        
        const row = [
          format(logDate, 'yyyy-MM-dd'),
          format(logDate, 'HH:mm'),
          peptide.name,
          log.dosageValue || '',
          log.dosageUnit || '',
          volumeDrawn,
          log.notes ? `"${log.notes.replace(/"/g, '""')}"` : ''
        ];
        
        rows.push(row.join(','));
      }
    });
  });
  
  // Create file content
  const csvContent = rows.join('\n');
  const fileName = `dose-history-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
  
  if (Platform.OS === 'web') {
    // Web export
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Mobile export using Expo
    const fileUri = FileSystem.documentDirectory + fileName;
    
    try {
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  }
}

export async function exportDoseHistoryAsPDF(options: ExportOptions): Promise<void> {
  // This would require a PDF generation library like react-native-pdf
  // For now, we'll throw an error to indicate it's not implemented
  throw new Error('PDF export is not yet implemented');
}