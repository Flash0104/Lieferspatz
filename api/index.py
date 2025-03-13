from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return 'Hello from Vercel!'

@app.route('/api')
def api():
    return {
        'message': 'Hello from Vercel API!',
        'status': 'success'
    }

if __name__ == '__main__':
    app.run() 