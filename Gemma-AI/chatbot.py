#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dan - AI Chatbot with Gemma 3 via Ollama
בוט צ'אט מבוסס בינה מלאכותית
"""

import requests
import json
import sys
from datetime import datetime

class DanChatbot:
    def __init__(self, model="gemma3:4b", ollama_url="http://localhost:11434"):
        """
        אתחול הבוט
        
        Args:
            model: שם המודל (gemma3:1b, gemma3:4b, gemma3:12b, gemma3:27b)
            ollama_url: כתובת שרת Ollama
        """
        self.model = model
        self.ollama_url = ollama_url
        self.api_url = f"{ollama_url}/api/generate"
        self.chat_history = []
        self.system_prompt = "אתה עוזר AI ידידותי ומועיל בשם דן. אתה עונה בעברית באופן ברור, מקצועי וידידותי."
        
    def check_connection(self):
        """בדיקת חיבור לשרת Ollama"""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            if response.status_code == 200:
                data = response.json()
                models = [m['name'] for m in data.get('models', [])]
                
                print("✅ החיבור לשרת Ollama הצליח!")
                print(f"📦 מודלים זמינים: {', '.join(models)}")
                
                if any('gemma' in m for m in models):
                    print("✅ מודל Gemma נמצא!")
                    return True
                else:
                    print("⚠️  מודל Gemma לא נמצא. הרץ: ollama pull gemma3")
                    return False
            else:
                print("❌ שגיאה בחיבור לשרת Ollama")
                return False
        except requests.exceptions.ConnectionError:
            print("❌ לא ניתן להתחבר לשרת Ollama")
            print("💡 ודא ש-Ollama מותקן ופועל: ollama serve")
            return False
        except Exception as e:
            print(f"❌ שגיאה: {e}")
            return False
    
    def generate_response(self, user_message, stream=False):
        """
        יצירת תשובה מהמודל
        
        Args:
            user_message: הודעת המשתמש
            stream: האם להציג את התשובה בזמן אמת
        
        Returns:
            תשובת הבוט
        """
        # הוספת ההודעה להיסטוריה
        self.chat_history.append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().strftime("%H:%M")
        })
        
        # בניית ההקשר
        context = f"{self.system_prompt}\n\n"
        for msg in self.chat_history[-5:]:  # 5 הודעות אחרונות
            role = "משתמש" if msg["role"] == "user" else "דן"
            context += f"{role}: {msg['content']}\n"
        context += "דן: "
        
        # שליחת הבקשה
        payload = {
            "model": self.model,
            "prompt": context,
            "stream": stream,
            "options": {
                "temperature": 0.7,
                "num_predict": 500
            }
        }
        
        try:
            if stream:
                # מצב streaming - הצגת תשובה בזמן אמת
                response = requests.post(
                    self.api_url,
                    json=payload,
                    stream=True,
                    timeout=60
                )
                
                full_response = ""
                print("🤖 דן: ", end="", flush=True)
                
                for line in response.iter_lines():
                    if line:
                        data = json.loads(line)
                        if 'response' in data:
                            chunk = data['response']
                            print(chunk, end="", flush=True)
                            full_response += chunk
                        
                        if data.get('done', False):
                            break
                
                print()  # שורה חדשה
                return full_response
            else:
                # מצב רגיל - המתנה לתשובה מלאה
                response = requests.post(
                    self.api_url,
                    json=payload,
                    timeout=60
                )
                
                if response.status_code == 200:
                    data = response.json()
                    bot_response = data.get('response', 'לא התקבלה תשובה')
                    return bot_response
                else:
                    return f"שגיאה: {response.status_code}"
                    
        except requests.exceptions.Timeout:
            return "⏱️ הבקשה ארכה יותר מדי זמן. נסה שוב."
        except Exception as e:
            return f"❌ שגיאה: {str(e)}"
    
    def chat(self, user_message):
        """
        שיחה עם הבוט
        
        Args:
            user_message: הודעת המשתמש
        """
        response = self.generate_response(user_message, stream=True)
        
        # שמירת התשובה בהיסטוריה
        self.chat_history.append({
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now().strftime("%H:%M")
        })
        
        return response
    
    def clear_history(self):
        """ניקוי היסטוריית השיחה"""
        self.chat_history = []
        print("🗑️  ההיסטוריה נמחקה")
    
    def show_history(self):
        """הצגת היסטוריית השיחה"""
        if not self.chat_history:
            print("📭 אין היסטוריה")
            return
        
        print("\n" + "="*60)
        print("📜 היסטוריית שיחה")
        print("="*60)
        
        for msg in self.chat_history:
            role = "👤 אתה" if msg["role"] == "user" else "🤖 דן"
            time = msg.get("timestamp", "")
            print(f"\n[{time}] {role}:")
            print(f"  {msg['content']}")
        
        print("="*60 + "\n")


def print_banner():
    """הדפסת כותרת"""
    banner = """
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              🤖 Dan - AI Chatbot 🤖                       ║
║                                                           ║
║              Powered by Gemma 3 & Ollama                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """
    print(banner)


def print_help():
    """הדפסת עזרה"""
    help_text = """
📖 פקודות זמינות:
  
  /help       - הצגת עזרה זו
  /clear      - ניקוי היסטוריית השיחה
  /history    - הצגת היסטוריית השיחה
  /model      - החלפת מודל
  /exit       - יציאה מהבוט
  
💬 כתוב הודעה כדי לשוחח עם דן!
    """
    print(help_text)


def main():
    """פונקציה ראשית"""
    # Fix encoding for Windows console
    if sys.platform == 'win32':
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    
    print_banner()
    
    # יצירת מופע של הבוט
    bot = DanChatbot(model="gemma3:4b")
    
    print("🔍 בודק חיבור לשרת Ollama...\n")
    
    if not bot.check_connection():
        print("\n💡 הוראות התקנה:")
        print("1. התקן Ollama: https://ollama.com/download")
        print("2. הרץ: ollama pull gemma3")
        print("3. הפעל את הבוט שוב")
        sys.exit(1)
    
    print("\n✨ הבוט מוכן! כתוב /help לעזרה\n")
    
    # לולאת שיחה ראשית
    while True:
        try:
            # קבלת קלט מהמשתמש
            user_input = input("👤 אתה: ").strip()
            
            if not user_input:
                continue
            
            # טיפול בפקודות
            if user_input.startswith('/'):
                command = user_input.lower()
                
                if command == '/exit' or command == '/quit':
                    print("\n👋 להתראות! תודה שהשתמשת בדן!")
                    break
                
                elif command == '/help':
                    print_help()
                
                elif command == '/clear':
                    bot.clear_history()
                
                elif command == '/history':
                    bot.show_history()
                
                elif command == '/model':
                    print("\n📦 מודלים זמינים:")
                    print("  1. gemma3:1b  - מהיר (1B פרמטרים)")
                    print("  2. gemma3:4b  - מאוזן (4B פרמטרים) [מומלץ]")
                    print("  3. gemma3:12b - חזק (12B פרמטרים)")
                    print("  4. gemma3:27b - מתקדם (27B פרמטרים)")
                    
                    choice = input("\nבחר מודל (1-4): ").strip()
                    models = {
                        '1': 'gemma3:1b',
                        '2': 'gemma3:4b',
                        '3': 'gemma3:12b',
                        '4': 'gemma3:27b'
                    }
                    
                    if choice in models:
                        bot.model = models[choice]
                        print(f"✅ המודל שונה ל-{bot.model}")
                    else:
                        print("❌ בחירה לא תקינה")
                
                else:
                    print(f"❌ פקודה לא מוכרת: {user_input}")
                    print("💡 כתוב /help לרשימת פקודות")
                
                continue
            
            # שיחה רגילה
            print()
            bot.chat(user_input)
            print()
            
        except KeyboardInterrupt:
            print("\n\n👋 להתראות!")
            break
        except Exception as e:
            print(f"\n❌ שגיאה: {e}")


if __name__ == "__main__":
    main()
