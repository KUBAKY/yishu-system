
const BASE_URL = "http://localhost:3000";

async function testInference(name, endpoint, payload, stream = false) {
  const url = `${BASE_URL}${endpoint}`;
  process.stdout.write(`Testing ${name}... `);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.log(`\n❌ Failed: Status ${response.status}`);
      try {
        const text = await response.text();
        console.log(text.slice(0, 500));
      } catch (e) {}
      return false;
    }

    if (stream) {
      // For Node.js fetch, body is a ReadableStream
      // We just need to check if we can read some data
      try {
        const reader = response.body.getReader();
        const { value, done } = await reader.read();
        if (!done && value) {
          console.log(`✅ Success`);
          // Cancel the stream as we only needed to verify it works
          reader.cancel(); 
          return true;
        } else {
          console.log(`\n❌ Failed: Empty stream`);
          return false;
        }
      } catch (e) {
        // Fallback for environments where getReader might not be standard (though Node 18+ has it)
        // Or if response.body is a Node stream
        if (response.body && typeof response.body.on === 'function') {
             console.log(`✅ Success (Node Stream)`);
             return true;
        }
        console.log(`\n❌ Error reading stream: ${e.message}`);
        return false;
      }
    } else {
      try {
        const data = await response.json();
        if (data.result) {
          console.log(`✅ Success`);
          return true;
        } else {
          console.log(`\n❌ Failed: No result in response`);
          console.log(data);
          return false;
        }
      } catch (e) {
        console.log(`\n❌ Failed: Invalid JSON response`);
        return false;
      }
    }
  } catch (e) {
    console.log(`\n❌ Error: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log("Starting Inference API Verification...");
  console.log(`Target: ${BASE_URL}`);
  console.log("-".repeat(50));

  const commonProfile = {
    name: "测试用户",
    gender: "男",
    birthDate: "1990-01-01",
    birthTime: "12:00",
    birthLocation: "北京",
  };
  
  const currentTime = new Date().toISOString();

  // 1. Bazi (Normal)
  await testInference("八字命理 (Bazi)", "/api/inference", {
    paradigm: "bazi",
    analysisMode: "natal",
    question: "我的事业运势如何？",
    currentTime,
    location: "北京",
    profile: commonProfile,
    eventContext: {
      background: "测试背景",
      urgency: "一般",
      horizon: "长期",
      mood: "平稳"
    }
  }, false);

  // 2. Liuyao (Normal)
  await testInference("六爻纳甲 (Liuyao)", "/api/inference", {
    paradigm: "liuyao",
    analysisMode: "event",
    question: "这次投资能赚钱吗？",
    currentTime,
    location: "北京",
    profile: commonProfile,
    eventContext: {
      background: "六爻卦象（初至上）：阴、阳、阴、阳、阴、阳；动爻位置：无动爻；问题：这次投资能赚钱吗？",
      urgency: "高",
      horizon: "30天内",
      mood: "谨慎"
    }
  }, false);

  // 3. Meihua (Normal)
  await testInference("梅花易数 (Meihua)", "/api/inference", {
    paradigm: "meihua",
    analysisMode: "event",
    question: "今日运势如何？",
    currentTime,
    location: "北京",
    profile: commonProfile,
    eventContext: {
      background: "MEIHUA::upper=乾;lower=坤;moving=1\n梅花易数：上卦为乾(天)，下卦为坤(地)，动爻在第1爻。问题：今日运势如何？",
      urgency: "一般",
      horizon: "24小时",
      mood: "平稳"
    }
  }, false);

  // 4. Tarot (Normal)
  await testInference("塔罗推演 (Tarot)", "/api/inference", {
    paradigm: "tarot",
    analysisMode: "event",
    question: "由于什么原因导致我现在很焦虑？",
    currentTime,
    location: "北京",
    profile: commonProfile,
    eventContext: {
      background: "塔罗三牌阵。现状：愚人（新的开始，冒险，纯真）；挑战：死神（结束，转变，放下）；建议：力量（勇气，耐心，柔韧）。咨询主题：由于什么原因导致我现在很焦虑？",
      urgency: "一般",
      horizon: "30天内",
      mood: "平稳"
    }
  }, false);

  // 5. Qimen (Stream)
  await testInference("奇门遁甲 (Qimen)", "/api/inference/stream", {
    paradigm: "qimen",
    analysisMode: "event",
    question: "能否成功追回债务？",
    currentTime,
    location: "北京",
    profile: commonProfile,
    eventContext: {
      background: "奇门任务：目标追回债务；可用资源法律手段；外部阻力对方失联；决策窗口7天；问题：能否成功追回债务？",
      urgency: "高",
      horizon: "7天",
      mood: "焦虑"
    }
  }, true);

  const dummyAttachment = {
    name: "test.jpg",
    type: "image/jpeg",
    dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwH7/9k=",
    note: "测试图片",
    category: "未分类"
  };

  // 6. Fengshui (Stream)
  await testInference("堪舆风水 (Fengshui)", "/api/inference/stream", {
    paradigm: "fengshui",
    analysisMode: "event",
    question: "如何改善卧室风水？",
    currentTime,
    location: "北京",
    profile: commonProfile,
    attachments: [dummyAttachment],
    eventContext: {
      background: "空间场景：住宅；朝向南；户型/布局两室一厅；症结区域卧室；常住人数2；问题：如何改善卧室风水？",
      urgency: "一般",
      horizon: "长期",
      mood: "平稳"
    }
  }, true);

  // 7. Zodiac (Stream)
  await testInference("星座占星 (Zodiac)", "/api/inference/stream", {
    paradigm: "zodiac",
    analysisMode: "forecast",
    forecastWindow: "3m",
    question: "未来三个月感情运势？",
    currentTime,
    location: "北京",
    profile: commonProfile,
    eventContext: {
      background: "星盘基于出生信息自动推导；阶段主题：感情；问题：未来三个月感情运势？",
      urgency: "一般",
      horizon: "3个月",
      mood: "期待"
    }
  }, true);

  // 8. Palmistry (Stream)
  await testInference("手相分析 (Palmistry)", "/api/inference/stream", {
    paradigm: "palmistry",
    analysisMode: "natal",
    question: "我的事业线如何？",
    currentTime,
    location: "北京",
    profile: commonProfile,
    attachments: [dummyAttachment],
    eventContext: {
      background: "手相分析：结合掌纹主线、掌丘起伏、手型比例判断先天倾向与阶段策略；问题：我的事业线如何？",
      urgency: "一般",
      horizon: "长期",
      mood: "平稳"
    }
  }, true);

  // 9. Physiognomy (Stream)
  await testInference("面相分析 (Physiognomy)", "/api/inference/stream", {
    paradigm: "physiognomy",
    analysisMode: "natal",
    question: "我的财帛宫如何？",
    currentTime,
    location: "北京",
    profile: commonProfile,
    attachments: [dummyAttachment],
    eventContext: {
      background: "面相分析：结合额、眉、眼、鼻、口与气色的结构特征判断风险与机会；问题：我的财帛宫如何？",
      urgency: "一般",
      horizon: "长期",
      mood: "平稳"
    }
  }, true);

  // 10. Naming (Stream)
  await testInference("五行取名 (Naming)", "/api/inference/stream", {
    paradigm: "naming",
    analysisMode: "naming",
    question: "请为新生儿取名",
    currentTime,
    location: "北京",
    namingContext: {
      child: {
        gender: "男",
        birthDate: "2024-01-01",
        birthTime: "12:00",
        birthLocation: "北京"
      },
      father: {
        name: "父亲",
        gender: "男",
        birthDate: "1990-01-01",
        birthTime: "12:00"
      },
      mother: {
        name: "母亲",
        gender: "女",
        birthDate: "1992-01-01",
        birthTime: "12:00"
      },
      preferences: {
        nameLengths: [2, 3],
        styles: ["古风"],
        otherStyle: "",
        mustIncludeChars: "",
        avoidChars: "",
        notes: ""
      }
    }
  }, true);

  // 11. Core Engine (Stream)
  await testInference("命盘推演中枢 (Core Engine)", "/api/inference/stream", {
    paradigm: "bazi",
    analysisMode: "event",
    question: "最近工作压力大，应该怎么办？",
    currentTime,
    location: "北京",
    profile: {
      ...commonProfile,
      currentResidence: "上海",
      currentStatus: "工作压力大",
      futureVision: "升职加薪"
    },
    eventContext: {
      background: "意图类型：事业决策\n事件背景：工作压力大\n紧迫度：高\n关注周期：一个月\n当前心境：焦虑",
      urgency: "高",
      horizon: "一个月",
      mood: "焦虑"
    }
  }, true);
}

main().catch(console.error);
