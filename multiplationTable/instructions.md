# Project: Multiplication Table Game

## Your Task
Build a web app that helps users practice multiplication tables. The app will quiz users with random multiplication questions and score them based on accuracy and speed.

---

## How the Game Works

1. User clicks "Start Game"
2. A random multiplication question appears (e.g., "3 × 5 = ?")
3. A timer starts counting seconds
4. User types their answer and submits
5. App shows if the answer was correct or wrong
6. Repeat for 20 questions total
7. Show final results with score

---

## Requirements

### Questions
- Generate random multiplication problems
- Both numbers should be between **1 and 10**
- Example: "7 × 8 = ?"
- Total of **20 questions** per game

### Timer
- Start counting when question appears
- Stop when user submits answer
- Track time for each question

### Scoring System

**Accuracy Points:**
- Correct answer = 5 points
- Wrong answer = 0 points
- Max accuracy score = 100 points (20 questions × 5 points)

**Speed Bonus (for correct answers only):**
- Under 2 seconds = +3 bonus points
- 2-4 seconds = +2 bonus points
- 4-6 seconds = +1 bonus point
- Over 6 seconds = no bonus

**Maximum possible score: 160 points**

---

## Screens to Build

### 1. Start Screen
- Game title: "Multiplication Challenge"
- "Start Game" button

### 2. Game Screen
- Question counter: "Question 5 / 20"
- The problem: "7 × 8 = ?"
- Input box for answer
- Timer showing seconds
- Submit button

### 3. Results Screen
- Correct answers: "18 / 20"
- Accuracy: "90%"
- Total time taken
- Final score
- "Play Again" button

---

## Files to Create

```
multiplicationTable/
├── index.html    (structure)
├── style.css     (styling)
└── script.js     (game logic)
```

---

## JavaScript Functions to Implement

| Function | Purpose |
|----------|---------|
| `generateQuestion()` | Create a random X × Y problem |
| `startTimer()` | Begin counting seconds |
| `checkAnswer()` | Check if user's answer is correct |
| `calculateScore()` | Add up accuracy + speed bonus |
| `nextQuestion()` | Move to the next question |
| `showResults()` | Display final score and stats |

---

## Data to Keep Track Of

- Current question number (1-20)
- The current problem (X and Y values)
- User's answers (array)
- Time per question (array)
- Number of correct answers
- Total score

---

## Bonus Challenges (Optional)

- Save high scores to localStorage
- Add sound effects
- Add difficulty levels (Easy: 1-5, Hard: 1-12)
- Show a progress bar
- Support Enter key to submit

---

Good luck!
