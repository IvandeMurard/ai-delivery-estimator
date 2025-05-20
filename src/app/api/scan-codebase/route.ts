import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

async function scanDir(dir: string, base = ''): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let files: string[] = [];
  for (const entry of entries) {
    const relPath = path.join(base, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await scanDir(path.join(dir, entry.name), relPath));
    } else {
      files.push(relPath.replace(/\\/g, '/'));
    }
  }
  return files;
}

export async function GET() {
  const srcPath = path.join(process.cwd(), 'src');
  try {
    const structure = await scanDir(srcPath);
    return NextResponse.json({ structure });
  } catch {
    return NextResponse.json({ error: 'Erreur lors du scan du codebase.' }, { status: 500 });
  }
} 