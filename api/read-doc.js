import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  
  const { filepath } = req.query;
  
  try {
    const docsPath = path.join(process.cwd(), 'docs');
    
    if (!filepath) {
      // List directory
      const listFilesRecursive = (dir, base = '') => {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
          const fullPath = path.join(dir, file);
          const relativePath = path.join(base, file);
          const stat = fs.statSync(fullPath);
          if (stat && stat.isDirectory()) {
            results = results.concat(listFilesRecursive(fullPath, relativePath));
          } else {
            results.push(relativePath);
          }
        });
        return results;
      };
      
      const files = listFilesRecursive(docsPath);
      return res.status(200).json({ files });
    }

    // Read specific file
    const targetPath = path.join(docsPath, filepath);
    
    // Security check to prevent path traversal
    if (!targetPath.startsWith(docsPath)) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    const content = fs.readFileSync(targetPath, 'utf-8');
    return res.status(200).json({ content });
    
  } catch (error) {
    console.error("Docs API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
