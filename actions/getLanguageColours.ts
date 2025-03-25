"use server"

import { promises as fs } from "fs"
import path from "path"

export async function getLanguageColours() {
  try {
    const filePath = path.join(process.cwd(), 'public/colours.json');
    console.log(process.cwd())
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error loading language colors:', error);
    return {};
  }
}