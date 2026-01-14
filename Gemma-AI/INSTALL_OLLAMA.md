# 📥 מדריך התקנת Ollama - Windows

## שלב 1: הורדת Ollama

1. **פתח דפדפן** וגש ל: **https://ollama.com/download**

2. **לחץ על "Download for Windows"**

3. **הורד את הקובץ** `OllamaSetup.exe`

## שלב 2: התקנת Ollama

1. **הרץ את הקובץ** `OllamaSetup.exe`

2. **עקוב אחר ההוראות** במסך ההתקנה

3. **המתן** עד שההתקנה תסתיים

4. **Ollama יפעל אוטומטית** ברקע

## שלב 3: וידוא ההתקנה

פתח **PowerShell** או **Command Prompt** והרץ:

```powershell
ollama --version
```

אם הכל תקין, תראה משהו כמו:
```
ollama version is 0.x.xx
```

## שלב 4: הורדת מודל Gemma 3

ב-PowerShell, הרץ:

```powershell
ollama pull gemma3
```

זה ייקח כמה דקות (תלוי במהירות האינטרנט).

### אפשרויות נוספות:

```powershell
# גרסה קטנה ומהירה (מומלץ למחשבים חלשים)
ollama pull gemma3:1b

# גרסה בינונית (מומלץ)
ollama pull gemma3:4b

# גרסה גדולה (דורש מחשב חזק)
ollama pull gemma3:12b
```

## שלב 5: בדיקה שהמודל הורד

```powershell
ollama list
```

אמור להופיע:
```
NAME            ID              SIZE      MODIFIED
gemma3:latest   abc123...       2.3 GB    X minutes ago
```

## שלב 6: הרצת הבוט!

עכשיו אתה מוכן! הרץ:

```powershell
python chatbot.py
```

---

## 🔧 פתרון בעיות

### Ollama לא מזוהה
- **סגור ופתח מחדש** את PowerShell
- **אתחל את המחשב**
- **בדוק** ש-Ollama הותקן ב-`C:\Users\<שם משתמש>\AppData\Local\Programs\Ollama`

### שגיאה בהורדת המודל
- **בדוק חיבור לאינטרנט**
- **נסה שוב** - לפעמים ההורדה נכשלת
- **נסה מודל קטן יותר**: `ollama pull gemma3:1b`

### Ollama לא פועל
```powershell
# הפעל את Ollama ידנית
ollama serve
```

---

## ✅ סיימת? עבור ל:

```powershell
python chatbot.py
```

**בהצלחה! 🚀**
