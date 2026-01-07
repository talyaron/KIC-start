"""
Multiplication Table Game - Flask Backend
"""
from flask import Flask, jsonify, request, send_from_directory
import random
import time

app = Flask(__name__, static_folder='static')

# In-memory game sessions (for simplicity)
game_sessions = {}

@app.route('/')
def serve_index():
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route('/api/start-game', methods=['POST'])
def start_game():
    """Initialize a new game session with 20 questions"""
    session_id = str(random.randint(10000, 99999))

    # Generate 20 random multiplication questions
    questions = []
    for _ in range(20):
        num1 = random.randint(1, 10)
        num2 = random.randint(1, 10)
        questions.append({
            'num1': num1,
            'num2': num2,
            'answer': num1 * num2
        })

    game_sessions[session_id] = {
        'questions': questions,
        'current_question': 0,
        'answers': [],
        'times': [],
        'score': 0,
        'correct_count': 0,
        'question_start_time': None
    }

    return jsonify({
        'session_id': session_id,
        'total_questions': 20
    })

@app.route('/api/get-question', methods=['POST'])
def get_question():
    """Get the current question and start the timer"""
    data = request.json
    session_id = data.get('session_id')

    if session_id not in game_sessions:
        return jsonify({'error': 'Invalid session'}), 400

    session = game_sessions[session_id]
    current_q = session['current_question']

    if current_q >= 20:
        return jsonify({'error': 'Game completed'}), 400

    question = session['questions'][current_q]
    session['question_start_time'] = time.time()

    return jsonify({
        'question_number': current_q + 1,
        'num1': question['num1'],
        'num2': question['num2'],
        'total_questions': 20
    })

@app.route('/api/submit-answer', methods=['POST'])
def submit_answer():
    """Submit an answer and get the result"""
    data = request.json
    session_id = data.get('session_id')
    user_answer = data.get('answer')

    if session_id not in game_sessions:
        return jsonify({'error': 'Invalid session'}), 400

    session = game_sessions[session_id]
    current_q = session['current_question']

    if current_q >= 20:
        return jsonify({'error': 'Game completed'}), 400

    # Calculate time taken
    time_taken = time.time() - session['question_start_time']
    session['times'].append(time_taken)

    # Check answer
    correct_answer = session['questions'][current_q]['answer']
    is_correct = int(user_answer) == correct_answer

    # Calculate points
    accuracy_points = 5 if is_correct else 0
    speed_bonus = 0

    if is_correct:
        if time_taken < 2:
            speed_bonus = 3
        elif time_taken < 4:
            speed_bonus = 2
        elif time_taken < 6:
            speed_bonus = 1

    question_score = accuracy_points + speed_bonus
    session['score'] += question_score

    if is_correct:
        session['correct_count'] += 1

    session['answers'].append({
        'user_answer': user_answer,
        'correct_answer': correct_answer,
        'is_correct': is_correct,
        'time_taken': time_taken,
        'points': question_score
    })

    session['current_question'] += 1

    return jsonify({
        'is_correct': is_correct,
        'correct_answer': correct_answer,
        'time_taken': round(time_taken, 2),
        'accuracy_points': accuracy_points,
        'speed_bonus': speed_bonus,
        'question_score': question_score,
        'total_score': session['score'],
        'game_complete': session['current_question'] >= 20
    })

@app.route('/api/get-results', methods=['POST'])
def get_results():
    """Get the final game results"""
    data = request.json
    session_id = data.get('session_id')

    if session_id not in game_sessions:
        return jsonify({'error': 'Invalid session'}), 400

    session = game_sessions[session_id]

    total_time = sum(session['times'])
    accuracy_percentage = (session['correct_count'] / 20) * 100

    return jsonify({
        'correct_count': session['correct_count'],
        'total_questions': 20,
        'accuracy_percentage': round(accuracy_percentage, 1),
        'total_time': round(total_time, 2),
        'final_score': session['score'],
        'max_possible_score': 160,
        'answers': session['answers']
    })

if __name__ == '__main__':
    print("Starting Multiplication Table Game Server...")
    print("Open http://localhost:5001 in your browser")
    app.run(debug=True, port=5001)
