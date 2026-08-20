import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Robust YYYY-MM-DD formatter to avoid timezone shift issues (Bug Fix for Holidays)
const formatYMD = (d) => {
    if (!d) return null;
    const date = new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export const exportToExcel = ({
    selectedUser,
    employees,
    logs,
    range,
    customDates,
    selectedMonth,
    selectedYear,
    holidays,
    notices,
    resolveLoc,
    offices,
    showToast
}) => {
    try {
        const currentEmployee = employees.find(e => String(e.id) === String(selectedUser));
        const empName = currentEmployee ? currentEmployee.name.replace(/\s+/g, '_') : "Company_Wide";

        let startDate, endDate;
        if (range === 'custom' && customDates.start && customDates.end) {
            startDate = new Date(customDates.start);
            endDate = new Date(customDates.end);
        } else if (range === 'today') {
            startDate = endDate = new Date();
        } else if (range === 'all') {
            const userLogs = selectedUser ? logs.filter(l => String(l.userId) === String(selectedUser)) : logs;
            if (userLogs.length > 0) {
                let minTime = new Date(userLogs[0].date || userLogs[0].checkIn).getTime();
                userLogs.forEach(l => {
                    const t = new Date(l.date || l.checkIn).getTime();
                    if (t < minTime) minTime = t;
                });
                startDate = new Date(minTime);
            } else {
                startDate = new Date();
                startDate.setDate(1);
            }
            endDate = new Date();
        } else if (range === 'monthly') {
            startDate = new Date(selectedYear, selectedMonth, 1);
            endDate = new Date(selectedYear, selectedMonth + 1, 0);
        } else {
            endDate = new Date();
            startDate = new Date();
            startDate.setDate(endDate.getDate() - (range === 'weekly' ? 7 : 365));
        }

        // SMART FILENAME
        let title = "";
        if (range === 'monthly') {
            const month = (endDate instanceof Date && !isNaN(endDate)) ? endDate.toLocaleString('default', { month: 'long' }) : 'Month';
            const year = (endDate instanceof Date && !isNaN(endDate)) ? endDate.getFullYear() : 'Year';
            title = `${empName}_${month}_${year}`;
        } else if (range === 'yearly') {
            const year = (endDate instanceof Date && !isNaN(endDate)) ? endDate.getFullYear() : 'Year';
            title = `${empName}_${year}`;
        } else {
            const sStr = (startDate instanceof Date && !isNaN(startDate)) ? startDate.toLocaleDateString('en-GB').replace(/\//g, '-') : 'Start';
            const eStr = (endDate instanceof Date && !isNaN(endDate)) ? endDate.toLocaleDateString('en-GB').replace(/\//g, '-') : 'End';
            title = `${empName}_${sStr}_to_${eStr}`;
        }

        // SMART TRIMMING
        const userLogsForTrim = selectedUser ? logs.filter(l => String(l.userId) === String(selectedUser)) : logs;
        if (userLogsForTrim.length > 0) {
            let firstLogTime = new Date(userLogsForTrim[0].date || userLogsForTrim[0].checkIn).getTime();
            userLogsForTrim.forEach(l => {
                const t = new Date(l.date || l.checkIn).getTime();
                if (t < firstLogTime) firstLogTime = t;
            });

            if (currentEmployee?.createdAt) {
                const created = new Date(currentEmployee.createdAt).getTime();
                if (created < firstLogTime) firstLogTime = created;
            }

            if (startDate.getTime() < firstLogTime) {
                startDate = new Date(firstLogTime);
            }
        }

        startDate.setHours(0, 0, 0, 0);
        const endLimit = new Date(endDate);
        endLimit.setHours(23, 59, 59, 999);

        const todayLimit = new Date();
        todayLimit.setHours(23, 59, 59, 999);
        const todayTime = todayLimit.getTime();

        const allDatesLogs = [];
        let curr = new Date(startDate);
        curr.setHours(0, 0, 0, 0);

        while (curr.getTime() <= endLimit.getTime()) {
            const dStr = curr.toDateString();
            const currTime = curr.getTime();

            const targetEmployees = selectedUser
                ? employees.filter(e => String(e.id) === String(selectedUser))
                : employees.filter(e => e.role !== 'ADMIN');

            targetEmployees.forEach(emp => {
                const ex = logs.find(l => {
                    const lDate = new Date(l.date || l.checkIn);
                    return lDate.toDateString() === dStr && String(l.userId) === String(emp.id);
                });

                if (ex) {
                    allDatesLogs.push(ex);
                } else {
                    const y = curr.getFullYear();
                    const m = String(curr.getMonth() + 1).padStart(2, '0');
                    const d = String(curr.getDate()).padStart(2, '0');
                    const isoD = `${y}-${m}-${d}`;

                    const isH = holidays.includes(isoD) || notices.some(n => n.type === 'HOLIDAY' && n.scheduledDate && new Date(n.scheduledDate).toISOString().split('T')[0] === isoD);
                    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][curr.getDay()];
                    const isW = (emp.weeklyOff || 'Sunday').toLowerCase() === dayName.toLowerCase();

                    // Only process past/today dates
                    if (currTime <= todayTime) {
                        if (selectedUser || (!isH && !isW)) {
                            allDatesLogs.push({
                                date: new Date(curr),
                                status: isH ? 'HOLIDAY' : (isW ? 'WEEKLY OFF' : 'ABSENT'),
                                user: emp,
                                isVirtual: true
                            });
                        }
                    }
                }
            });
            curr.setDate(curr.getDate() + 1);
        }

        const wsData = allDatesLogs.map(l => {
            const lDate = new Date(l.date || l.checkIn);
            const isoD = formatYMD(lDate);

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = days[lDate.getDay()];

            const isH = holidays.includes(isoD) || notices.some(n => n.type === 'HOLIDAY' && n.scheduledDate && formatYMD(n.scheduledDate) === isoD);
            const isW = (l.user?.weeklyOff || 'Sunday').toLowerCase() === dayName.toLowerCase();

            let statusText = l.status || 'ABSENT';
            if (!l.checkIn) statusText = isH ? 'HOLIDAY' : (isW ? 'WEEKLY OFF' : 'ABSENT');

            return {
                Date: lDate.toLocaleDateString('en-GB'),
                Day: dayName,
                Name: l.user?.name || "N/A",
                In: l.checkIn ? new Date(l.checkIn).toLocaleTimeString() : '---',
                Out: l.checkOut && !l.isAutoCheckout ? new Date(l.checkOut).toLocaleTimeString() : '---',
                Status: statusText,
                Duration: l.checkIn && l.checkOut && !l.isAutoCheckout ? ((new Date(l.checkOut) - new Date(l.checkIn)) / 3600000).toFixed(2) + ' hrs' : '--',
                Location: resolveLoc(l, offices),
                Notes: l.isVirtual ? 'Auto Checked Out' : (l.isAutoCheckout ? 'Auto checked out' : (l.notes || ''))
            }
        });

        const s_present = wsData.filter(d => d.Status === 'PRESENT' || d.Status === 'LATE').length;
        const s_late = wsData.filter(d => d.Status === 'LATE').length;
        const s_absent = wsData.filter(d => d.Status === 'ABSENT').length;
        const s_weekly = wsData.filter(d => d.Status === 'WEEKLY OFF').length;
        const s_holiday = wsData.filter(d => d.Status === 'HOLIDAY').length;
        const s_leave = wsData.filter(d => d.Status === 'LEAVE').length;
        const s_working = wsData.length - s_weekly - s_holiday - s_leave;
        const s_score = s_working > 0 ? Math.round((s_present / s_working) * 100) : 0;

        const summaryData = [
            { Metric: "REPORT ANALYTICS SUMMARY", Value: "" },
            { Metric: "Employee", Value: currentEmployee?.name || "ALL" },
            { Metric: "Date Range", Value: `${startDate.toLocaleDateString('en-GB')} - ${endDate.toLocaleDateString('en-GB')}` },
            { Metric: "", Value: "" },
            { Metric: "Total Presence", Value: s_present },
            { Metric: "Total Late", Value: s_late },
            { Metric: "Total Absents", Value: s_absent },
            { Metric: "Weekly Offs", Value: s_weekly },
            { Metric: "Company Holidays", Value: s_holiday },
            { Metric: "Approved Leaves", Value: s_leave },
            { Metric: "Working Days", Value: s_working },
            { Metric: "Punctuality Score", Value: s_score + "%" }
        ];

        const wb = XLSX.utils.book_new();

        // ADD SUMMARY ANALYTICS FOR ALL-EMPLOYEE REPORTS
        if (!selectedUser) {
            const userSummaryMap = {};
            wsData.forEach(row => {
                if (!userSummaryMap[row.Name]) {
                    userSummaryMap[row.Name] = { Name: row.Name, Present: 0, Absent: 0, Leave: 0, Late: 0 };
                }
                const s = row.Status;
                if (s === 'PRESENT' || s === 'LATE') userSummaryMap[row.Name].Present++;
                if (s === 'ABSENT') userSummaryMap[row.Name].Absent++;
                if (s === 'LEAVE') userSummaryMap[row.Name].Leave++;
                if (s === 'LATE') userSummaryMap[row.Name].Late++;
            });
            const analyticsData = Object.values(userSummaryMap);
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analyticsData), "Personnel Analytics");
        }

        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wsData), "Detailed Log");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Overall Insights");

        // NATIVE LIBRARY DOWNLOAD TRIGGER (MOST RELIABLE)
        const safeTitle = (title.replace(/[^a-z0-9_-]/gi, '_')) || `Report_${new Date().getTime()}`;
        const finalFileName = `${safeTitle}.xlsx`;

        XLSX.writeFile(wb, finalFileName);

        showToast("Excel Report Generated Successfully", "success");
    } catch (err) {
        console.error("CRITICAL EXCEL ERROR:", err);
        showToast(`Excel Generation Failed: ${err.message}`, "error");
    }
};

export const exportToPDF = ({
    selectedUser,
    employees,
    logs,
    range,
    customDates,
    selectedMonth,
    selectedYear,
    holidays,
    notices,
    showToast
}) => {
    try {
        const currentEmployee = employees.find(e => String(e.id) === String(selectedUser));
        const empName = currentEmployee ? currentEmployee.name.replace(/\s+/g, '_') : "Company_Wide";
        const doc = new jsPDF();

        let start = new Date();
        const userLogs = selectedUser ? logs.filter(l => String(l.userId) === String(selectedUser)) : logs;

        let end = new Date();
        if (range === 'all' && userLogs.length > 0) {
            let minT = new Date(userLogs[0].date || userLogs[0].checkIn).getTime();
            userLogs.forEach(l => {
                const t = new Date(l.date || l.checkIn).getTime();
                if (t < minT) minT = t;
            });
            start = new Date(minT);
        } else if (range === 'custom' && customDates.start) {
            start = new Date(customDates.start);
            if (customDates.end) end = new Date(customDates.end);
        } else if (range === 'monthly') {
            start = new Date(selectedYear, selectedMonth, 1);
            end = new Date(selectedYear, selectedMonth + 1, 0);
        } else {
            start.setDate(start.getDate() - (range === 'weekly' ? 7 : range === 'monthly' ? 30 : 365));
        }

        // SMART FILENAME
        let title = "";
        if (range === 'monthly') {
            const month = (end instanceof Date && !isNaN(end)) ? end.toLocaleString('default', { month: 'long' }) : 'Month';
            const year = (end instanceof Date && !isNaN(end)) ? end.getFullYear() : 'Year';
            title = `${empName}_${month}_${year}`;
        } else if (range === 'yearly') {
            const year = (end instanceof Date && !isNaN(end)) ? end.getFullYear() : 'Year';
            title = `${empName}_${year}`;
        } else {
            const sStr = (start instanceof Date && !isNaN(start)) ? start.toLocaleDateString('en-GB').replace(/\//g, '-') : 'Start';
            const eStr = (end instanceof Date && !isNaN(end)) ? end.toLocaleDateString('en-GB').replace(/\//g, '-') : 'End';
            title = `${empName}_${sStr}_to_${eStr}`;
        }

        // DRAW HEADER
        doc.setFillColor(124, 58, 237);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase().replace(/_/g, ' '), 15, 25);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()} | Protocol: ${range.toUpperCase()}`, 15, 33);

        // SMART TRIMMING
        if (selectedUser && userLogs.length > 0) {
            let firstActivity = new Date(userLogs[0].date || userLogs[0].checkIn).getTime();
            userLogs.forEach(l => {
                const t = new Date(l.date || l.checkIn).getTime();
                if (t < firstActivity) firstActivity = t;
            });

            if (currentEmployee?.createdAt) {
                const created = new Date(currentEmployee.createdAt).getTime();
                if (created < firstActivity) firstActivity = created;
            }

            if (start.getTime() < firstActivity) {
                start = new Date(firstActivity);
            }
        }

        const todayLimit = new Date();
        todayLimit.setHours(23, 59, 59, 999);
        const todayTime = todayLimit.getTime();
        const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const fullLogs = [];
        let curr = new Date(start);
        curr.setHours(0, 0, 0, 0);
        const endLimit = new Date(end);
        endLimit.setHours(23, 59, 59, 999);

        while (curr.getTime() <= endLimit.getTime()) {
            const dStr = curr.toDateString();
            const currTime = curr.getTime();

            const targetEmployees = selectedUser
                ? employees.filter(e => String(e.id) === String(selectedUser))
                : employees.filter(e => e.role !== 'ADMIN');

            targetEmployees.forEach(emp => {
                const ex = logs.find(l => {
                    const lDate = new Date(l.date || l.checkIn);
                    return lDate.toDateString() === dStr && String(l.userId) === String(emp.id);
                });

                if (ex) {
                    fullLogs.push(ex);
                } else {
                    const y = curr.getFullYear();
                    const m = String(curr.getMonth() + 1).padStart(2, '0');
                    const d = String(curr.getDate()).padStart(2, '0');
                    const isoD = `${y}-${m}-${d}`;

                    const isH = holidays.includes(isoD) || notices.some(n => n.scheduledDate && new Date(n.scheduledDate).toISOString().split('T')[0] === isoD);
                    const dayName = daysArr[curr.getDay()];
                    const isW = (emp.weeklyOff || 'Sunday').toLowerCase() === dayName.toLowerCase();

                    if (currTime <= todayTime) {
                        if (selectedUser || (!isH && !isW)) {
                            fullLogs.push({
                                date: new Date(curr),
                                status: isH ? 'HOLIDAY' : (isW ? 'WEEKLY OFF' : 'ABSENT'),
                                user: emp,
                                isVirtual: true
                            });
                        }
                    }
                }
            });
            curr.setDate(curr.getDate() + 1);
        }

        const enrichedLogs = fullLogs.map(l => {
            const lDate = new Date(l.date || l.checkIn);
            const dayName = daysArr[lDate.getDay()];
            const isoD = formatYMD(lDate);
            const isH = holidays.includes(isoD) || notices.some(n => n.scheduledDate && formatYMD(n.scheduledDate) === isoD);
            const isW = (l.user?.weeklyOff || 'Sunday').toLowerCase() === dayName.toLowerCase();

            let status = l.status || 'ABSENT';
            if (!l.checkIn) status = isH ? 'HOLIDAY' : (isW ? 'WEEKLY OFF' : 'ABSENT');

            return { ...l, calculatedStatus: status, formattedDate: lDate.toLocaleDateString('en-GB') };
        });

        const tableData = enrichedLogs.map(l => {
            return [
                l.formattedDate,
                l.checkIn ? new Date(l.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---',
                l.checkOut && !l.isAutoCheckout ? new Date(l.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---',
                { content: l.calculatedStatus, styles: { textColor: l.calculatedStatus === 'PRESENT' ? [34, 197, 94] : (l.calculatedStatus === 'ABSENT' ? [239, 68, 68] : (l.calculatedStatus === 'LATE' ? [245, 158, 11] : [124, 58, 237])) } },
                l.checkIn && l.checkOut && !l.isAutoCheckout ? ((new Date(l.checkOut) - new Date(l.checkIn)) / 3600000).toFixed(2) : '--'
            ];
        });

        const processedStatuses = enrichedLogs.map(l => l.calculatedStatus);
        const s_present = processedStatuses.filter(s => s === 'PRESENT' || s === 'LATE').length;
        const s_late = processedStatuses.filter(s => s === 'LATE').length;
        const s_absent = processedStatuses.filter(s => s === 'ABSENT').length;
        const s_weekly = processedStatuses.filter(s => s === 'WEEKLY OFF').length;
        const s_holiday = processedStatuses.filter(s => s === 'HOLIDAY').length;
        const s_leave = processedStatuses.filter(s => s === 'LEAVE').length;
        const s_working = processedStatuses.length - s_weekly - s_holiday - s_leave;
        const s_score = s_working > 0 ? Math.round((s_present / s_working) * 100) : 0;

        // ADD SUMMARY TABLE FOR ALL-EMPLOYEE PDF
        if (!selectedUser) {
            const pdfSummaryMap = {};
            enrichedLogs.forEach(l => {
                const name = l.user?.name || "Unknown";
                const status = l.calculatedStatus;
                if (!pdfSummaryMap[name]) {
                    pdfSummaryMap[name] = { Name: name, Present: 0, Absent: 0, Leave: 0, Late: 0 };
                }
                if (status === 'PRESENT' || status === 'LATE') pdfSummaryMap[name].Present++;
                if (status === 'ABSENT') pdfSummaryMap[name].Absent++;
                if (status === 'LEAVE') pdfSummaryMap[name].Leave++;
                if (status === 'LATE') pdfSummaryMap[name].Late++;
            });
            const pdfAnalyticsBody = Object.values(pdfSummaryMap).map(u => [u.Name, u.Present, u.Absent, u.Leave, u.Late]);

            doc.setFontSize(14);
            doc.setTextColor(15, 23, 42);
            doc.text("PERSONNEL PERFORMANCE MATRIX", 15, 55);

            autoTable(doc, {
                startY: 60,
                head: [['Employee Name', 'Present', 'Absent', 'Leave', 'Late']],
                body: pdfAnalyticsBody,
                headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 9 }
            });
            doc.addPage();
        }

        autoTable(doc, {
            startY: !selectedUser ? 20 : 50,
            head: [['Date', 'Check-In', 'Check-Out', 'Status', 'Work Hrs']],
            body: tableData,
            headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 255] }
        });

        const finalY = doc.lastAutoTable.finalY + 20;
        if (finalY > 250) doc.addPage();
        const summaryY = finalY > 250 ? 20 : finalY;

        doc.setFillColor(248, 250, 252);
        doc.rect(15, summaryY, 180, 50, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(15, summaryY, 180, 50, 'S');

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("FINAL PERFORMANCE SUMMARY", 25, summaryY + 12);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);

        doc.text(`Total Present: ${s_present}`, 25, summaryY + 25);
        doc.text(`Total Late: ${s_late}`, 85, summaryY + 25);
        doc.text(`Total Absent: ${s_absent}`, 145, summaryY + 25);

        doc.text(`Weekly Offs: ${s_weekly}`, 25, summaryY + 35);
        doc.text(`Company Holidays: ${s_holiday}`, 85, summaryY + 35);
        doc.text(`Approved Leaves: ${s_leave}`, 145, summaryY + 35);

        doc.text(`Punctuality: ${s_score}%`, 25, summaryY + 45);

        // NATIVE LIBRARY PDF DOWNLOAD (MOST RELIABLE)
        const safePdfTitle = (title.replace(/[^a-z0-9_-]/gi, '_')) || `PDF_Report_${new Date().getTime()}`;
        const finalPdfName = `${safePdfTitle}.pdf`;

        doc.save(finalPdfName);

        showToast("Enhanced PDF Report Generated", "success");
    } catch (err) {
        console.error("PDF Error:", err);
        showToast("PDF Engine Failure: Check Console", "error");
    }
};
