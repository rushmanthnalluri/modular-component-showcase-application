import { buildApiUrl } from "@/services/apiClient";

function copyWithTextarea(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textArea);
  }
}

export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    return copyWithTextarea(text);
  } catch (error) {
    console.error("Clipboard copy failed:", error);
    return copyWithTextarea(text);
  }
}

export function exportComponentCode(component, format = "jsx") {
  let content = "";
  let filename = `${component.id}`;

  if (format === "jsx") {
    content = component.code.jsx;
    filename += ".jsx";
  } else if (format === "css") {
    content = component.code.css;
    filename += ".css";
  } else if (format === "bundle") {
    content = `/**
 * ${component.name}
 * Version: ${component.version || "1.0.0"}
 * Description: ${component.description}
 */

/* JSX CODE */
${component.code.jsx}

/* CSS CODE */
${component.code.css}`;
    filename += ".bundle.js";
  } else if (format === "with-imports") {
    content = `${component.importStatements?.standard || ""}

${component.code.jsx}

${component.code.css}`;
    filename += ".jsx";
  }

  return { content, filename };
}

export function downloadFile(content, filename, mimeType = "text/plain") {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download error:", error);
  }
}

export async function downloadFromServer(componentId, format = "jsx") {
  try {
    const response = await fetch(buildApiUrl(`/components/${componentId}/export?format=${format}`), {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const filename = response.headers.get("content-disposition")?.split("filename=")[1] || `component.${format}`;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Server download error:", error);
  }
}

export function generateImportStatement(component, framework = "react") {
  const componentName = component.name.replace(/\s+/g, "");

  if (framework === "react") {
    return `import ${componentName} from '@/components/${component.id}';\n\n<${componentName} />`;
  } else if (framework === "vue") {
    return `import ${componentName} from '@/components/${component.id}.vue';\n\n<${componentName} />`;
  } else if (framework === "svelte") {
    return `import ${componentName} from '@/components/${component.id}.svelte';\n\n<${componentName} />`;
  } else if (framework === "angular") {
    return `import { ${componentName} } from '@/components';\n\n<app-${component.id}></app-${component.id}>`;
  }

  return `import ${componentName} from '@/components/${component.id}';`;
}
