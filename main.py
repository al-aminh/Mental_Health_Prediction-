import os
import pandas as pd
import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Literal

model = joblib.load("Mental_Health_Model.pkl")
top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

app = FastAPI(
    title="Student Mental Health Prediction API",
    description="API for predicting student mental health score based on academic, lifestyle, and social media habits.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

class StudentData(BaseModel):
    age                     : int   = Field(..., ge=0, le=100, description="")
    gender                  : Literal["Male", "Female"]
    country                 : str
    academic_level          : Literal['Undergraduate', 'Graduate', 'High School']
    most_used_platform      : Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat','Twitter','YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp','WeChat']
    purpose_of_use          : Literal['Networking', 'Education', 'Entertainment', 'News']
    avg_daily_usage_hours   : float = Field(..., ge=0, le=24)
    daily_unlocks           : int   = Field(..., ge=0)
    study_hours             : float = Field(..., ge=0, le=24)
    physical_activity_hours : float = Field(..., ge=0, le=24)
    sleep_hours_per_night   : float = Field(..., ge=0, le=24)
    stress_level            : Literal['Medium', 'Low', 'Very High', 'High']    



class PredictionResponse(BaseModel):
    mental_health_score: float


@app.get("/")
def read_root():
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Welcome to the Mental Health Score Prediction API!"}

@app.get("/style.css")
def get_style():
    style_file = os.path.join(FRONTEND_DIR, "style.css")
    if os.path.exists(style_file):
        return FileResponse(style_file, media_type="text/css")
    return {"error": "style.css not found"}

@app.get("/script.js")
def get_script():
    script_file = os.path.join(FRONTEND_DIR, "script.js")
    if os.path.exists(script_file):
        return FileResponse(script_file, media_type="application/javascript")
    return {"error": "script.js not found"}

@app.post("/predict", response_model=PredictionResponse)
def predict(data: StudentData):
    
    country_group = data.country if data.country in top_countries else "Other"

    input_data = pd.DataFrame([{
        'Study_Hours': data.study_hours,
        'Age': data.age,
        'Avg_Daily_Usage_Hours': data.avg_daily_usage_hours,
        'Daily_Unlocks': data.daily_unlocks,
        'Physical_Activity_Hours': data.physical_activity_hours,
        'Sleep_Hours_Per_Night': data.sleep_hours_per_night,
        'Stress_Level': data.stress_level,
        'Gender': data.gender,
        'Academic_Level': data.academic_level,
        'Most_Used_Platform': data.most_used_platform,
        'Purpose_Of_Use': data.purpose_of_use,
        'Group_Countries': country_group
    }])

    prediction = model.predict(input_data)[0]

    return PredictionResponse(mental_health_score=round(float(prediction), 2))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)