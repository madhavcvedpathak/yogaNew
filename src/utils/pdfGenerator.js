import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

export const generatePDF = (sessionData) => {
    try {
        console.log("Generating PDF with data:", sessionData);
        const doc = new jsPDF();
        const { practitionerName, sessionStartTime, sessionEndTime, detectedPoses, metrics } = sessionData;

        // --- Branding & Header ---
        doc.setFillColor(212, 163, 115); // ayur-primary
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('times', 'bold');
        doc.setFontSize(24);
        doc.text('A Y U R S U T R A', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Yoga Pose Monitoring & Diagnostic Report', 105, 30, { align: 'center' });

        // --- I. Session Metrics ---
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('I. Session Metrics', 14, 55);

        const durationMinutes = ((sessionEndTime - sessionStartTime) / 1000 / 60).toFixed(2);
        const dateStr = sessionEndTime.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
        const timeStr = sessionEndTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const metricsData = [
            ['Name', practitionerName, 'Date', dateStr],
            ['Total Duration', `${durationMinutes} Minutes`, 'Time', timeStr],
            ['Analyzed Frames', metrics.totalFrames, 'Avg Confidence', `${(metrics.avgConfidence * 100).toFixed(2)}%`]
        ];

        autoTable(doc, {
            startY: 60,
            head: [],
            body: metricsData,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', width: 40 }, 2: { fontStyle: 'bold', width: 40 } },
        });

        // --- II. Pose Duration Analysis ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('II. Pose Duration Analysis', 14, doc.lastAutoTable.finalY + 15);

        const poseTableData = metrics.poseDurations.map((p, i) => [
            `${i + 1}. ${p.name}`,
            p.frames,
            `${(p.time).toFixed(1)} s`
        ]);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Pose Name', 'Frames Detected', 'Total Time (Approx)']],
            body: poseTableData,
            theme: 'striped',
            headStyles: { fillColor: [212, 163, 115] },
        });

        // --- III. Ancient Wisdom & Improvement Plan ---
        let yPos = doc.lastAutoTable.finalY + 20;
        if (yPos > 230) { doc.addPage(); yPos = 20; }

        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'bold');
        doc.text('III. Ancient Wisdom & Improvement Plan', 14, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Helper to print bold text segments
        const printLine = (label, value) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, 20, yPos);
            const labelWidth = doc.getTextWidth(label);
            doc.setFont('helvetica', 'normal');
            const splitValue = doc.splitTextToSize(value, 170 - labelWidth);
            doc.text(splitValue, 20 + labelWidth, yPos);
            yPos += (splitValue.length * 5) + 5;
        };

        doc.text('• Ensure the light of the sun (or room) illuminates your form clearly.', 14, yPos);
        yPos += 7;

        doc.text('• ', 14, yPos);
        printLine('Strength Observed: ', metrics.narrative.strength);

        doc.text('• ', 14, yPos);
        printLine('Area for Growth: ', metrics.narrative.growth);

        doc.text('• ', 14, yPos);
        printLine('General Advice: ', metrics.narrative.advice);

        // --- Footer ---
        doc.setFont('times', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('--- Om Shanti Shanti Shanti ---', 105, 280, { align: 'center' });

        console.log("Saving PDF...");
        doc.save(`Ayursutra_Report_${practitionerName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
        console.error("PDF Generation Error:", error);
        alert(`Failed to generate PDF: ${error.message}`);
    }
};
