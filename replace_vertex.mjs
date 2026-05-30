import fs from 'fs';
import path from 'path';

const dir = 'src/lib/ai';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.ts')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace import
    content = content.replace(/import\s+\{\s*VertexAI\s*\}\s+from\s+["']@google-cloud\/vertexai["'];?/g, 'import { GoogleGenAI } from "@google/genai";');

    // Remove GOOGLE_CLOUD_PROJECT checks
    content = content.replace(/const project \= process\.env\.GOOGLE_CLOUD_PROJECT;\n?/g, '');
    content = content.replace(/const location \= process\.env\.GOOGLE_CLOUD_LOCATION \|\| 'us-central1';\n?/g, '');
    content = content.replace(/if\s*\(!project\)\s*\{\s*throw new Error\(.*?\);\s*\}\n?/g, '');
    content = content.replace(/if\s*\(!project\)\s*throw new Error\(.*?\);\n?/g, '');

    // Replace initialization
    content = content.replace(/const vertexai = new VertexAI\(\{.*?\}\);\n\s*const model = vertexai\.getGenerativeModel\(\{\s*model:\s*"(.*?)"\s*\}\);/gs, (match, modelName) => {
        let m = modelName.includes('0409') ? 'gemini-2.5-pro' : modelName;
        return `const ai = new GoogleGenAI({});\n  const modelId = "${m}";`;
    });

    // Replace model.generateContent
    content = content.replace(/const result = await model\.generateContent\((.*?)\);/gs, (match, promptArg) => {
           return `const result = await ai.models.generateContent({ model: modelId, contents: ${promptArg} });`;
    });

    // Replace result text extraction
    content = content.replace(/const text = result\.response\.candidates\?\.\[0\]\?\.content\?\.parts\?\.\[0\]\?\.text \|\| (.*);/g, "const text = result.text || $1;");

    fs.writeFileSync(filePath, content);
  }
}
