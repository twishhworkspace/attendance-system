const xss = require('xss');
const prisma = require('../prisma/client');

const getOffices = async (req, res) => {
  try {
    const offices = await prisma.office.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(offices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch office nodes' });
  }
};

const addOffice = async (req, res) => {
  const { name, address, location, radius, startTime, endTime } = req.body;
  
  // Basic coordinate format validation (e.g., "18.5204, 73.8567")
  const coordRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
  if (location && !coordRegex.test(location)) {
    return res.status(400).json({ error: 'Invalid coordinate format. Use: "latitude, longitude"' });
  }

  try {
    const office = await prisma.office.create({
      data: {
        name: xss(name),
        address: xss(address),
        location,
        radius: parseFloat(radius) || 100,
        startTime: startTime || "08:00",
        endTime: endTime || "20:00",
        companyId: req.user.companyId
      }
    });
    res.status(201).json(office);
  } catch (err) {
    res.status(500).json({ error: 'Failed to register office node' });
  }
};

const deleteOffice = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.office.delete({
      where: { id, companyId: req.user.companyId }
    });
    res.json({ message: 'Office node deconstructed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete office node' });
  }
};

const updateOffice = async (req, res) => {
  const { id } = req.params;
  const { name, address, location, radius, startTime, endTime } = req.body;
  try {
    const updated = await prisma.office.update({
      where: { id, companyId: req.user.companyId },
      data: {
        name: name ? xss(name) : undefined,
        address: address ? xss(address) : undefined,
        location,
        radius: parseFloat(radius) || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update office node' });
  }
};

module.exports = { getOffices, addOffice, deleteOffice, updateOffice };
