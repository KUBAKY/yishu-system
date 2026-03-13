import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:3000"

def test_inference(name, endpoint, payload, stream=False):
    url = f"{BASE_URL}{endpoint}"
    print(f"Testing {name}...", end=" ", flush=True)
    
    try:
        response = requests.post(url, json=payload, stream=stream, timeout=30)
        
        if response.status_code != 200:
            print(f"\n❌ Failed: Status {response.status_code}")
            try:
                print(response.text[:500])
            except:
                pass
            return False
            
        if stream:
            # Check if we get at least some content
            chunk_received = False
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    chunk_received = True
                    break
            
            if chunk_received:
                print(f"✅ Success")
                return True
            else:
                print(f"\n❌ Failed: Empty stream")
                return False
        else:
            try:
                data = response.json()
                if "result" in data and data["result"]:
                    print(f"✅ Success")
                    return True
                else:
                    print(f"\n❌ Failed: No result in response")
                    print(data)
                    return False
            except json.JSONDecodeError:
                 print(f"\n❌ Failed: Invalid JSON response")
                 print(response.text[:200])
                 return False
                
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

def main():
    print("Starting Inference API Verification...")
    print(f"Target: {BASE_URL}")
    print("-" * 50)

    common_profile = {
        "name": "测试用户",
        "gender": "男",
        "birthDate": "1990-01-01",
        "birthTime": "12:00",
        "birthLocation": "北京"
    }
    
    current_time = datetime.now().isoformat()

    # 1. Bazi (Normal)
    test_inference("八字命理 (Bazi)", "/api/inference", {
        "paradigm": "bazi",
        "analysisMode": "natal",
        "question": "我的事业运势如何？",
        "currentTime": current_time,
        "location": "北京",
        "profile": common_profile,
        "eventContext": {
            "background": "测试背景",
            "urgency": "一般",
            "horizon": "长期",
            "mood": "平稳"
        }
    }, stream=False)

    # 2. Liuyao (Normal)
    test_inference("六爻纳甲 (Liuyao)", "/api/inference", {
        "paradigm": "liuyao",
        "analysisMode": "event",
        "question": "这次投资能赚钱吗？",
        "currentTime": current_time,
        "location": "北京",
        "profile": common_profile,
        "eventContext": {
            "background": "六爻卦象（初至上）：阴、阳、阴、阳、阴、阳；动爻位置：无动爻；问题：这次投资能赚钱吗？",
            "urgency": "高",
            "horizon": "30天内",
            "mood": "谨慎"
        }
    }, stream=False)

    # 3. Meihua (Normal)
    test_inference("梅花易数 (Meihua)", "/api/inference", {
        "paradigm": "meihua",
        "analysisMode": "event",
        "question": "今日运势如何？",
        "currentTime": current_time,
        "location": "北京",
        "profile": common_profile,
        "eventContext": {
            "background": "MEIHUA::upper=乾;lower=坤;moving=1\n梅花易数：上卦为乾(天)，下卦为坤(地)，动爻在第1爻。问题：今日运势如何？",
            "urgency": "一般",
            "horizon": "24小时",
            "mood": "平稳"
        }
    }, stream=False)

    # 4. Tarot (Normal)
    test_inference("塔罗推演 (Tarot)", "/api/inference", {
        "paradigm": "tarot",
        "analysisMode": "event",
        "question": "由于什么原因导致我现在很焦虑？",
        "currentTime": current_time,
        "location": "北京",
        "profile": common_profile,
        "eventContext": {
            "background": "塔罗三牌阵。现状：愚人（新的开始，冒险，纯真）；挑战：死神（结束，转变，放下）；建议：力量（勇气，耐心，柔韧）。咨询主题：由于什么原因导致我现在很焦虑？",
            "urgency": "一般",
            "horizon": "30天内",
            "mood": "平稳"
        }
    }, stream=False)

    # 5. Qimen (Stream)
    test_inference("奇门遁甲 (Qimen)", "/api/inference/stream", {
        "paradigm": "qimen",
        "analysisMode": "event",
        "question": "能否成功追回债务？",
        "currentTime": current_time,
        "location": "北京",
        "profile": common_profile,
        "eventContext": {
            "background": "奇门任务：目标追回债务；可用资源法律手段；外部阻力对方失联；决策窗口7天；问题：能否成功追回债务？",
            "urgency": "高",
            "horizon": "7天",
            "mood": "焦虑"
        }
    }, stream=True)

    # 6. Fengshui (Stream)
    test_inference("堪舆风水 (Fengshui)", "/api/inference/stream", {
        "paradigm": "fengshui",
        "analysisMode": "event",
        "question": "如何改善卧室风水？",
        "currentTime": current_time,
        "location": "北京",
        "profile": common_profile,
        "eventContext": {
            "background": "空间场景：住宅；朝向南；户型/布局两室一厅；症结区域卧室；常住人数2；问题：如何改善卧室风水？",
            "urgency": "一般",
            "horizon": "长期",
            "mood": "平稳"
        }
    }, stream=True)

    # 7. Zodiac (Stream)
    test_inference("星座占星 (Zodiac)", "/api/inference/stream", {
        "paradigm": "zodiac",
        "analysisMode": "forecast",
        "forecastWindow": "3m",
        "question": "未来三个月感情运势？",
        "currentTime": current_time,
        "location": "北京",
        "profile": common_profile,
        "eventContext": {
            "background": "星盘基于出生信息自动推导；阶段主题：感情；问题：未来三个月感情运势？",
            "urgency": "一般",
            "horizon": "3个月",
            "mood": "期待"
        }
    }, stream=True)

    # 8. Palmistry (Stream)
    test_inference("手相分析 (Palmistry)", "/api/inference/stream", {
        "paradigm": "palmistry",
        "analysisMode": "natal",
        "question": "我的事业线如何？",
        "currentTime": current_time,
        "location": "北京",
        "profile": common_profile,
        "eventContext": {
            "background": "手相分析：结合掌纹主线、掌丘起伏、手型比例判断先天倾向与阶段策略；问题：我的事业线如何？",
            "urgency": "一般",
            "horizon": "长期",
            "mood": "平稳"
        }
    }, stream=True)

    # 9. Physiognomy (Stream)
    test_inference("面相分析 (Physiognomy)", "/api/inference/stream", {
        "paradigm": "physiognomy",
        "analysisMode": "natal",
        "question": "我的财帛宫如何？",
        "currentTime": current_time,
        "location": "北京",
        "profile": common_profile,
        "eventContext": {
            "background": "面相分析：结合额、眉、眼、鼻、口与气色的结构特征判断风险与机会；问题：我的财帛宫如何？",
            "urgency": "一般",
            "horizon": "长期",
            "mood": "平稳"
        }
    }, stream=True)

    # 10. Naming (Stream)
    test_inference("五行取名 (Naming)", "/api/inference/stream", {
        "paradigm": "naming",
        "analysisMode": "naming",
        "question": "请为新生儿取名",
        "currentTime": current_time,
        "location": "北京",
        "namingContext": {
            "child": {
                "gender": "男",
                "birthDate": "2024-01-01",
                "birthTime": "12:00",
                "birthLocation": "北京"
            },
            "father": {
                "name": "父亲",
                "gender": "男",
                "birthDate": "1990-01-01",
                "birthTime": "12:00"
            },
            "mother": {
                "name": "母亲",
                "gender": "女",
                "birthDate": "1992-01-01",
                "birthTime": "12:00"
            },
            "preferences": {
                "nameLengths": [2, 3],
                "styles": ["古风"],
                "otherStyle": "",
                "mustIncludeChars": "",
                "avoidChars": "",
                "notes": ""
            }
        }
    }, stream=True)

    # 11. Start Page / Core Engine (Stream)
    test_inference("命盘推演中枢 (Core Engine)", "/api/inference/stream", {
        "paradigm": "bazi",
        "analysisMode": "event",
        "question": "最近工作压力大，应该怎么办？",
        "currentTime": current_time,
        "location": "北京",
        "profile": {
            **common_profile,
            "currentResidence": "上海",
            "currentStatus": "工作压力大",
            "futureVision": "升职加薪"
        },
        "eventContext": {
            "background": "意图类型：事业决策\n事件背景：工作压力大\n紧迫度：高\n关注周期：一个月\n当前心境：焦虑",
            "urgency": "高",
            "horizon": "一个月",
            "mood": "焦虑"
        }
    }, stream=True)

if __name__ == "__main__":
    main()
