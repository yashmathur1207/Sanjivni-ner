import os
from flask import Flask, jsonify, request
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
CORS(app)

# Database Configuration (Uses a local app.db file for fast development)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    uid = db.Column(db.String(50), unique=True, nullable=False)
    role = db.Column(db.String(20), default='patient') # 'patient' or 'caregiver'
    region = db.Column(db.String(50))
    
    # Relationship to link users to their game sessions
    sessions = db.relationship('GameSession', backref='patient', lazy=True)

class GameSession(db.Model):
    __tablename__ = 'game_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_id = db.Column(db.String(50), nullable=False) # e.g., 'gamosa-pattern-match'
    score = db.Column(db.Integer, nullable=False)
    completion_time = db.Column(db.Integer) # in seconds
    timestamp = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "game_id": self.game_id,
            "score": self.score,
            "completion_time": self.completion_time,
            "timestamp": self.timestamp.isoformat()
        }
@app.route('/', methods=['GET'])
def home():
    """Default root endpoint so terminal links load immediately."""
    return jsonify({
        "status": "healthy",
        "message": "Sanjivni-NER Backend is live!"
    }), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for services and frontend."""
    return jsonify({
        "status": "healthy", 
        "message": "Sanjivni-NER Backend is live!"
    }), 200

@app.route('/api/telemetry', methods=['POST'])
def save_telemetry():
    """Receives game data from the React frontend and saves it to the database."""
    data = request.json
    
    # 🚨 HACKATHON SHORTCUT: 
    # Since we haven't built a full login system yet, we will auto-create 
    # a dummy patient profile ("Aita") if the database is completely empty.
    user = User.query.first()
    if not user:
        user = User(uid="SANJ-8842-NER", role="patient", region="Assam")
        db.session.add(user)
        db.session.commit()

    # 1. Map the incoming JSON to our Database Model
    new_session = GameSession(
        user_id=user.id,
        game_id=data.get('gameId'),
        score=data.get('score'),
        completion_time=data.get('timeSpent')
    )
    
    # 2. Save it to the database
    db.session.add(new_session)
    db.session.commit()
    
    # 3. Send a success receipt back to React
    return jsonify({
        "status": "success", 
        "message": "Telemetry saved successfully!",
        "session_id": new_session.id
    }), 201
@app.route('/api/patient/metrics', methods=['GET'])
def get_patient_metrics():
    """Fetches the most recent game telemetry for the Caregiver Dashboard."""
    
    # 🚨 HACKATHON SHORTCUT: 
    # Hardcoding the lookup for our demo patient "Aita" (SANJ-8842-NER)
    user = User.query.filter_by(uid="SANJ-8842-NER").first()
    
    if not user:
        return jsonify({"status": "error", "message": "Patient not found"}), 404

    # Fetch the patient's most recent game session
    latest_session = GameSession.query.filter_by(user_id=user.id)\
                                      .order_by(GameSession.timestamp.desc())\
                                      .first()
    
    if not latest_session:
        return jsonify({
            "status": "success",
            "metrics": {
                "latest_score": None,
                "latest_game": "No sessions played yet",
                "time_spent": 0
            }
        }), 200

    # Send the data back to React
    return jsonify({
        "status": "success",
        "metrics": {
            "latest_score": latest_session.score,
            "latest_game": latest_session.game_id,
            "time_spent": latest_session.completion_time,
            "timestamp": latest_session.timestamp.isoformat()
        }
    }), 200
if __name__ == '__main__':
    app.run(debug=True, port=5000)