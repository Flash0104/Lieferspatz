from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/<restaurant>/menu')
def menu(restaurant):
    return render_template('menu.html', restaurant=restaurant)

@app.route('/order-overview')
def order_overview():
    return render_template('order.html')

if __name__ == '__main__':
    app.run(debug=True)
