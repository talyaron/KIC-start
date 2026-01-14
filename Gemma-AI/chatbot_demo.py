#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dan - AI Chatbot DEMO (ללא Ollama)
גרסת הדגמה שעובדת ללא Ollama
"""

import sys
import time
import random
from datetime import datetime

class DanChatbotDemo:
    def __init__(self):
        """אתחול הבוט במצב demo"""
        self.chat_history = []
        self.responses = {
            "שלום": ["שלום! איך אני יכול לעזור לך היום? 😊", "היי! נעים להכיר, אני דן!"],
            "מה שלומך": ["אני בסדר גמור, תודה! ואתה?", "מצוין! תודה ששאלת 😊"],
            "מי אתה": ["אני דן, בוט צ'אט מבוסס בינה מלאכותית. אני פועל עם Gemma 3 דרך Ollama!", "שמי דן ואני עוזר AI ידידותי!"],
            "עזרה": ["אני יכול לעזור לך עם:\n- שאלות כלליות\n- כתיבת קוד\n- רעיונות יצירתיים\n- ועוד הרבה!", "במה אתה צריך עזרה? אני כאן בשבילך!"],
            "תודה": ["בשמחה! תמיד כאן לעזור 😊", "אין בעד מה! שמח לעזור!"],
            "ביי": ["להתראות! היה נחמד לשוחח איתך! 👋", "ביי ביי! חזור בקרוב! 😊"],
        }
        
    def generate_demo_response(self, user_message):
        """יצירת תשובה במצב demo"""
        message_lower = user_message.lower().strip()
        
        # חיפוש תשובה מתאימה
        for keyword, responses in self.responses.items():
            if keyword in message_lower:
                return random.choice(responses)
        
        # תשובות כלליות
        general_responses = [
            f"זו שאלה מעניינת! בגרסה המלאה עם Ollama, הייתי עונה בצורה מפורטת יותר על: '{user_message}'",
            f"אני במצב DEMO כרגע. כדי לקבל תשובה אמיתית על '{user_message}', התקן את Ollama והרץ: python chatbot.py",
            f"שאלה טובה! בגרסה המלאה אני משתמש ב-Gemma 3 כדי לענות על שאלות כמו: '{user_message}'",
            "זה נושא מרתק! התקן את Ollama כדי לקבל תשובות מלאות ומפורטות ממני 😊",
        ]
        
        return random.choice(general_responses)
    
    def simulate_typing(self, text):
        """סימולציה של הקלדה"""
        print("🤖 דן: ", end="", flush=True)
        for char in text:
            print(char, end="", flush=True)
            time.sleep(0.02)  # עיכוב קטן בין תווים
        print()
    
    def chat(self, user_message):
        """שיחה עם הבוט"""
        # הוספת הודעת משתמש להיסטוריה
        self.chat_history.append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().strftime("%H:%M")
        })
        
        # יצירת תשובה
        response = self.generate_demo_response(user_message)
        
        # הצגת התשובה עם אפקט הקלדה
        self.simulate_typing(response)
        
        # שמירת התשובה בהיסטוריה
        self.chat_history.append({
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now().strftime("%H:%M")
        })
        
        return response
    
    def clear_history(self):
        """ניקוי היסטוריה"""
        self.chat_history = []
        print("🗑️  ההיסטוריה נמחקה")
    
    def show_history(self):
        """הצגת היסטוריה"""
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
║           🤖 Dan - AI Chatbot (DEMO) 🤖                   ║
║                                                           ║
║              ⚠️  מצב הדגמה - ללא Ollama                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

⚠️  זוהי גרסת DEMO עם תשובות מוגבלות
💡 להתקנת Ollama ושימוש מלא, ראה: INSTALL_OLLAMA.md
    """
    print(banner)


def print_help():
    """הדפסת עזרה"""
    help_text = """
📖 פקודות זמינות:
  
  /help       - הצגת עזרה זו
  /clear      - ניקוי היסטוריית השיחה
  /history    - הצגת היסטוריית השיחה
  /install    - הוראות התקנת Ollama
  /exit       - יציאה מהבוט
  
💬 כתוב הודעה כדי לשוחח עם דן!

💡 טיפ: נסה לכתוב "שלום", "מי אתה", או "עזרה"
    """
    print(help_text)


def print_install_instructions():
    """הדפסת הוראות התקנה"""
    instructions = """
📥 הוראות התקנת Ollama:

1️⃣  גש ל: https://ollama.com/download
2️⃣  הורד את Ollama עבור Windows
3️⃣  הרץ את קובץ ההתקנה
4️⃣  פתח PowerShell והרץ: ollama pull gemma3
5️⃣  הרץ: python chatbot.py

📚 למדריך מפורט ראה: INSTALL_OLLAMA.md
    """
    print(instructions)


def main():
    """פונקציה ראשית"""
    # Fix encoding for Windows console
    if sys.platform == 'win32':
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    
    print_banner()
    
    # יצירת מופע של הבוט
    bot = DanChatbotDemo()
    
    print("\n✨ הבוט במצב DEMO מוכן! כתוב /help לעזרה\n")
    
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
                    print("💡 התקן את Ollama לחוויה מלאה!")
                    break
                
                elif command == '/help':
                    print_help()
                
                elif command == '/clear':
                    bot.clear_history()
                
                elif command == '/history':
                    bot.show_history()
                
                elif command == '/install':
                    print_install_instructions()
                
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
