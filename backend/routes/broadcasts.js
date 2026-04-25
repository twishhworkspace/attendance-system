const express = require('express');
const router = express.Router();
console.log("[MOUNT] BROADCAST ROUTES INITIALIZING...");
const prisma = require('../prisma/client');

// Fetch all active broadcasts for the global alert system
router.get('/active', async (req, res) => {
  console.log("[DEBUG] ENTERING BROADCAST /ACTIVE HANDLER");
  try {
    const broadcasts = await prisma.systemBroadcast.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 5 
    });
    console.log(`[DEBUG] BROADCASTS RETRIEVED: ${broadcasts?.length}`);
    res.json(broadcasts);
  } catch (err) {
    console.error('[DEBUG] BROADCAST FETCH ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch active alerts.' });
  }
});

module.exports = router;
