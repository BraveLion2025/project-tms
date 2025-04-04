/**
 * Project-TMS File System Server
 * Handles file system operations for the Project-TMS application
 */
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const STORAGE_DIR = path.join(__dirname, 'storage');

// Enable CORS
app.use(cors());

// Parse JSON requests
app.use(bodyParser.json({ limit: '50mb' }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Ensure storage directory exists
async function ensureStorageDir() {
    try {
        await fs.access(STORAGE_DIR);
    } catch (error) {
        // Create directory if it doesn't exist
        await fs.mkdir(STORAGE_DIR, { recursive: true });
        console.log(`Created storage directory: ${STORAGE_DIR}`);
    }
}

// File API Routes

/**
 * Get list of files in storage directory
 */
app.get('/api/files', async (req, res) => {
    try {
        await ensureStorageDir();
        const files = await fs.readdir(STORAGE_DIR);
        res.json({ files });
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

/**
 * Read file content
 */
app.get('/api/files/:filename', async (req, res) => {
    try {
        const filePath = path.join(STORAGE_DIR, req.params.filename);
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            res.json(JSON.parse(data));
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, return empty data structure
                const emptyData = req.params.filename.includes('tasks') || req.params.filename.includes('projects') ? 
                    [] : {};
                res.json(emptyData);
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error(`Error reading file ${req.params.filename}:`, error);
        res.status(500).json({ error: `Failed to read file: ${error.message}` });
    }
});

/**
 * Write to file
 */
app.post('/api/files/:filename', async (req, res) => {
    try {
        await ensureStorageDir();
        const filePath = path.join(STORAGE_DIR, req.params.filename);
        
        // Validate file is in storage directory (security check)
        if (!filePath.startsWith(STORAGE_DIR)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
        res.json({ success: true, message: `File ${req.params.filename} saved successfully` });
    } catch (error) {
        console.error(`Error writing file ${req.params.filename}:`, error);
        res.status(500).json({ error: `Failed to write file: ${error.message}` });
    }
});

/**
 * Delete file
 */
app.delete('/api/files/:filename', async (req, res) => {
    try {
        const filePath = path.join(STORAGE_DIR, req.params.filename);
        
        // Validate file is in storage directory (security check)
        if (!filePath.startsWith(STORAGE_DIR)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        try {
            await fs.unlink(filePath);
            res.json({ success: true, message: `File ${req.params.filename} deleted successfully` });
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File already doesn't exist
                res.json({ success: true, message: `File ${req.params.filename} already doesn't exist` });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error(`Error deleting file ${req.params.filename}:`, error);
        res.status(500).json({ error: `Failed to delete file: ${error.message}` });
    }
});

/**
 * Export all data (backup)
 */
app.get('/api/export', async (req, res) => {
    try {
        await ensureStorageDir();
        const files = await fs.readdir(STORAGE_DIR);
        
        const data = {};
        
        // Read all files in storage
        for (const filename of files) {
            if (filename.endsWith('.json')) {
                const filePath = path.join(STORAGE_DIR, filename);
                const content = await fs.readFile(filePath, 'utf8');
                
                try {
                    data[filename.replace('.json', '')] = JSON.parse(content);
                } catch (e) {
                    console.warn(`Skipping non-JSON file: ${filename}`);
                }
            }
        }
        
        // Add export metadata
        data.exportDate = new Date().toISOString();
        data.version = '2.0';
        
        res.json(data);
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

/**
 * Import data (restore from backup)
 */
app.post('/api/import', async (req, res) => {
    try {
        await ensureStorageDir();
        
        const data = req.body;
        
        if (!data || typeof data !== 'object') {
            return res.status(400).json({ error: 'Invalid data format' });
        }
        
        // Validate core data structures
        if (!data.projects || !Array.isArray(data.projects)) {
            return res.status(400).json({ error: 'Invalid projects data' });
        }
        
        if (!data.tasks || !Array.isArray(data.tasks)) {
            return res.status(400).json({ error: 'Invalid tasks data' });
        }
        
        // Write projects file
        await fs.writeFile(
            path.join(STORAGE_DIR, 'projects.json'),
            JSON.stringify(data.projects, null, 2)
        );
        
        // Write tasks file
        await fs.writeFile(
            path.join(STORAGE_DIR, 'tasks.json'),
            JSON.stringify(data.tasks, null, 2)
        );
        
        // Write settings if present
        if (data.settings) {
            await fs.writeFile(
                path.join(STORAGE_DIR, 'settings.json'),
                JSON.stringify(data.settings, null, 2)
            );
        }
        
        // Record import time
        await fs.writeFile(
            path.join(STORAGE_DIR, 'last_sync.json'),
            JSON.stringify({ lastSync: new Date().toISOString() }, null, 2)
        );
        
        res.json({ 
            success: true, 
            message: 'Data imported successfully',
            stats: {
                projectCount: data.projects.length,
                taskCount: data.tasks.length
            }
        });
    } catch (error) {
        console.error('Error importing data:', error);
        res.status(500).json({ error: `Failed to import data: ${error.message}` });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Project-TMS server running on port ${PORT}`);
});