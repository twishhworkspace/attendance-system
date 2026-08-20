import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

// Safe filename formatter
const sanitizeFilename = (name) => {
    return name ? name.replace(/[^a-z0-9_-]/gi, '_') : 'ledger';
};

// Formats date nicely
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

export const exportExpenseToExcel = ({
    employee,
    bookName,
    activeTab,
    currentDate,
    entries,
    summary,
    dailyData,
    monthlyData,
    yearlyData,
    showToast
}) => {
    try {
        const empName = employee?.name || 'Employee';
        const empEmail = employee?.email || '';
        const title = `${sanitizeFilename(empName)}_${sanitizeFilename(bookName)}_${activeTab.toUpperCase()}`;

        const wb = XLSX.utils.book_new();

        // 1. Ledger Sheet Data
        let detailedData = [];
        let cfBalance = 0;
        let totalC = summary.totalCredit;
        let totalD = summary.totalDebit;
        let net = summary.netBalance;

        if (activeTab === 'yearly') {
            cfBalance = yearlyData?.cfBalance || 0;
            detailedData.push({
                Month: 'Carried Forward Balance',
                'Credit (+)': '',
                'Debit (-)': '',
                'Closing Balance': cfBalance
            });
            const rows = yearlyData?.rows || [];
            rows.forEach(r => {
                detailedData.push({
                    Month: r.monthName || r.monthIndex,
                    'Credit (+)': r.income !== undefined ? r.income : (r.credit || 0),
                    'Debit (-)': r.expense !== undefined ? r.expense : (r.debit || 0),
                    'Closing Balance': r.balance
                });
            });
        } else {
            let list = entries;
            if (activeTab === 'daily') {
                cfBalance = dailyData?.cfBalance || 0;
                totalC = dailyData?.incomeTotal !== undefined ? dailyData.incomeTotal : (dailyData?.totalCredit || 0);
                totalD = dailyData?.expenseTotal !== undefined ? dailyData.expenseTotal : (dailyData?.totalDebit || 0);
                net = dailyData?.endDayBalance !== undefined ? dailyData.endDayBalance : (dailyData?.netBalance || 0);

                const targetStr = new Date(currentDate).toISOString().split('T')[0];
                list = entries.filter(e => new Date(e.date).toISOString().split('T')[0] === targetStr);
            } else if (activeTab === 'monthly') {
                cfBalance = monthlyData?.cfBalance || 0;
                totalC = monthlyData?.totalIncome !== undefined ? monthlyData.totalIncome : (monthlyData?.monthCredit || 0);
                totalD = monthlyData?.totalExpense !== undefined ? monthlyData.totalExpense : (monthlyData?.monthDebit || 0);
                net = monthlyData?.monthBalance !== undefined ? monthlyData.monthBalance : (monthlyData?.monthNet || 0);

                const year = new Date(currentDate).getFullYear();
                const month = new Date(currentDate).getMonth();
                list = entries.filter(e => {
                    const d = new Date(e.date);
                    return d.getFullYear() === year && d.getMonth() === month;
                });
            }

            // Sort chronologically for running balance in Excel sheet
            const sorted = [...list].sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime());
            
            detailedData.push({
                Date: 'Carried Forward',
                Narration: 'Balance prior to selected period',
                Type: '-',
                'Credit (+)': '',
                'Debit (-)': '',
                Status: '-',
                'Running Balance': cfBalance
            });

            let run = cfBalance;
            sorted.forEach(entry => {
                const isRejected = entry.status === 'REJECTED';
                const c = (entry.type === 'CREDIT' && !isRejected) ? entry.amount : 0;
                const d = (entry.type === 'DEBIT' && !isRejected) ? entry.amount : 0;
                run = run + c - d;
                detailedData.push({
                    Date: formatDate(entry.date),
                    Narration: entry.narration || 'No Memo',
                    Type: entry.type,
                    'Credit (+)': entry.type === 'CREDIT' ? entry.amount : '',
                    'Debit (-)': entry.type === 'DEBIT' ? entry.amount : '',
                    Status: entry.status || 'PENDING',
                    'Running Balance': run
                });
            });
        }

        // 2. Summary Sheet Data
        const summaryData = [
            { Metric: "EXPENSE REPORT SUMMARY", Value: "" },
            { Metric: "Employee", Value: empName },
            { Metric: "Email", Value: empEmail },
            { Metric: "Expense Book", Value: bookName },
            { Metric: "Period Protocol", Value: activeTab.toUpperCase() },
            { Metric: "Date Generated", Value: new Date().toLocaleDateString('en-GB') },
            { Metric: "", Value: "" },
            { Metric: "Carried Forward Balance (C/F)", Value: cfBalance },
            { Metric: "Total Period Credits", Value: totalC },
            { Metric: "Total Period Debits", Value: totalD },
            { Metric: "Net Closing Balance", Value: net }
        ];

        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedData), "Ledger Sheets");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Report Metadata");

        XLSX.writeFile(wb, `${title}.xlsx`);
        if (showToast) showToast("Excel Financial Statement Exported", "success");
    } catch (err) {
        console.error("Excel Export Error:", err);
        if (showToast) showToast(`Excel Export Failed: ${err.message}`, "error");
    }
};

export const exportExpenseToPDF = async ({
    employee,
    bookName,
    activeTab,
    showToast
}) => {
    try {
        let elementId = 'print-area-employee';
        let element = document.getElementById(elementId);
        if (!element) {
            elementId = 'print-area-admin';
            element = document.getElementById(elementId);
        }

        if (!element) {
            throw new Error('Ledger print template not found in active workspace view.');
        }

        const empName = employee?.name || 'Employee';
        const title = `${sanitizeFilename(empName)}_${sanitizeFilename(bookName)}_${activeTab.toUpperCase()}`;

        // Save original classes
        const originalClass = element.className;
        
        // Temporarily render block for canvas capture
        element.classList.remove('hidden');
        element.classList.remove('print:block');
        
        // Align on white background with off-screen positioning
        element.style.position = 'fixed';
        element.style.left = '-9999px';
        element.style.top = '0';
        element.style.width = '800px';
        element.style.backgroundColor = '#ffffff';

        // Wait for layout reflow
        await new Promise(r => setTimeout(r, 120));

        const canvas = await html2canvas(element, {
            scale: 2, // High resolution scaling
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // Restore original state
        element.className = originalClass;
        element.style.position = '';
        element.style.left = '';
        element.style.top = '';
        element.style.width = '';
        element.style.backgroundColor = '';

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`${title}.pdf`);
        if (showToast) showToast('Statement PDF Exported', 'success');
    } catch (err) {
        console.error('High-fidelity PDF generation failed:', err);
        if (showToast) showToast(`PDF Export Failed: ${err.message}`, 'error');
    }
};
