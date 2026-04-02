const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const prisma = require("./prismaClient");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/super", require("./routes/superRoutes"));

// --- THE HR SELF-HEALING ENGINE ---
async function runStartupSweep() {
    try {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        // Locate ANY unclosed shifts logically existing PRIOR to today at 12:00 AM
        const unclosed = await prisma.attendance.updateMany({
            where: {
                date: { lt: today },
                checkOut: null
            },
            data: { 
                checkOut: new Date().toISOString(),
                reason: "AUTO_CHECKOUT"
            }
        });

        if (unclosed.count > 0) {
            console.log(`🛠️ [ENGINE] Self-Healing Executed: Recovered ${unclosed.count} abandoned shifts from when the server was offline.`);
        } else {
            console.log("✅ [ENGINE] Database health verified. No offline reconciliation needed.");
        }
    } catch (err) {
        console.error("❌ [ENGINE] Fatal Sweeper Error:", err);
    }
}

// Executes autonomously every single day at exactly 12:00 AM
cron.schedule("0 0 * * *", () => {
    console.log("🕛 [CRON] Triggering Midnight Sweeper...");
    runStartupSweep();
});

// Boot Sequence
app.listen(5000, async () => {
    console.log("Server running on port 5000");
    console.log("🚀 [BOOT] Initializing System Health Checks...");
    await runStartupSweep();
});