import joblib
from fastapi import FastAPI

model = joblib.load("Mental_Health_Model.pkl")

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Mental Health Score Prediction API!"}

