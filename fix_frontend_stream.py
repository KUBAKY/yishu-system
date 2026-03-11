import re

with open('src/app/start/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 替换 inference 路由为 inference/stream 
content = content.replace('await fetch("/api/inference"', 'await fetch("/api/inference/stream"')

# 将处理 onSubmit 的 JSON 逻辑替换为 ReadableStream 处理逻辑
json_handle_pattern = r'const data = \(await response\.json\(\)\) as InferenceResponse \| \{ error: string \};\n\s*if \(!response\.ok \|\| "error" in data\) \{\n\s*throw new Error\("error" in data \? data\.error : "推演失败"\);\n\s*\}\n\n\s*setResult\(data\);\n\s*setReportView\("overview"\);\n\s*const parsed = parseResultSections\(data\.result\);\n\s*localStorage\.setItem\(LAST_REPORT_KEY, parsed\.overview\);\n\s*setLastReportSummary\(parsed\.overview\);'

stream_handle_code = """
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "推演失败" }));
        throw new Error(errorData.error || "推演失败");
      }

      setReportView("overview");
      setResult({
          result: "",
          meta: {
            paradigm: paradigmSpec,
            paradigmLabel: modeLabel,
            model: "streaming...",
            reference: "",
            citations: []
          }
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamResult = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\\n").filter(line => line.trim() !== "");
          
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.content) {
                  streamResult += parsed.content;
                  setResult(prev => {
                      if (!prev) return null;
                      return { ...prev, result: streamResult };
                  });
                }
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
      }
      
      const parsed = parseResultSections(streamResult);
      localStorage.setItem(LAST_REPORT_KEY, parsed.overview);
      setLastReportSummary(parsed.overview);
      
      // Update meta to match actual values after completely generated
      const data = {
          result: streamResult,
          meta: {
              paradigm: paradigmSpec,
              paradigmLabel: modeLabel,
              model: "anthropic/claude-3.5-sonnet",
              reference: "",
              citations: [],
          }
      };
      setResult(data);
"""

content = re.sub(json_handle_pattern, stream_handle_code, content, flags=re.DOTALL)

with open('src/app/start/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

