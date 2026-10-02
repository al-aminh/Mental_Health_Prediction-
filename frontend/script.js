/**
 * Student Mental Health Prediction - Frontend Logic
 * Connects to FastAPI backend (/predict) and provides interactive dashboard UI.
 */

// ============================================================================
// Configuration
// ============================================================================
const API_BASE_URL = (window.location.origin && !window.location.origin.startsWith('file:') && window.location.origin !== 'null')
  ? window.location.origin
  : 'http://127.0.0.1:8000';

const PREDICT_ENDPOINT = `${API_BASE_URL}/predict`;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 50; // 314.159

// ============================================================================
// Preset Personas for Demonstration & Testing
// ============================================================================
const PRESETS = {
  balanced: {
    age: 21,
    gender: 'Female',
    country: 'USA',
    academic_level: 'Undergraduate',
    most_used_platform: 'YouTube',
    purpose_of_use: 'Education',
    avg_daily_usage_hours: 2.0,
    daily_unlocks: 45,
    study_hours: 5.5,
    physical_activity_hours: 2.0,
    sleep_hours_per_night: 8.0,
    stress_level: 'Low'
  },
  stressed: {
    age: 22,
    gender: 'Male',
    country: 'Canada',
    academic_level: 'Undergraduate',
    most_used_platform: 'Instagram',
    purpose_of_use: 'Entertainment',
    avg_daily_usage_hours: 4.5,
    daily_unlocks: 95,
    study_hours: 7.5,
    physical_activity_hours: 0.5,
    sleep_hours_per_night: 4.5,
    stress_level: 'High'
  },
  burnout: {
    age: 20,
    gender: 'Female',
    country: 'UK',
    academic_level: 'Undergraduate',
    most_used_platform: 'TikTok',
    purpose_of_use: 'Entertainment',
    avg_daily_usage_hours: 8.5,
    daily_unlocks: 160,
    study_hours: 1.5,
    physical_activity_hours: 0.0,
    sleep_hours_per_night: 4.0,
    stress_level: 'Very High'
  },
  athlete: {
    age: 19,
    gender: 'Male',
    country: 'Australia',
    academic_level: 'High School',
    most_used_platform: 'Instagram',
    purpose_of_use: 'Networking',
    avg_daily_usage_hours: 2.5,
    daily_unlocks: 50,
    study_hours: 4.0,
    physical_activity_hours: 3.5,
    sleep_hours_per_night: 8.5,
    stress_level: 'Low'
  }
};

// ============================================================================
// DOM Elements
// ============================================================================
const elements = {
  form: document.getElementById('predictionForm'),
  submitBtn: document.getElementById('submitBtn'),
  btnText: document.getElementById('btnText'),
  resetBtn: document.getElementById('resetBtn'),
  apiStatusDot: document.getElementById('apiStatusDot'),
  apiStatusText: document.getElementById('apiStatusText'),

  // Output Cards
  initialCard: document.getElementById('initialCard'),
  resultCard: document.getElementById('resultCard'),
  errorCard: document.getElementById('errorCard'),
  errorMessage: document.getElementById('errorMessage'),
  retryBtn: document.getElementById('retryBtn'),

  // Result Elements
  scoreValue: document.getElementById('scoreValue'),
  gaugeProgress: document.getElementById('gaugeProgress'),
  resultStatusTag: document.getElementById('resultStatusTag'),
  resultHeading: document.getElementById('resultHeading'),
  resultTierDesc: document.getElementById('resultTierDesc'),
  resultTimestamp: document.getElementById('resultTimestamp'),
  spectrumIndicator: document.getElementById('spectrumIndicator'),
  recommendationText: document.getElementById('recommendationText'),

  // Factor Highlights
  factorSleepVal: document.getElementById('factorSleepVal'),
  factorSleepBar: document.getElementById('factorSleepBar'),
  factorMediaVal: document.getElementById('factorMediaVal'),
  factorMediaBar: document.getElementById('factorMediaBar'),
  factorStudyVal: document.getElementById('factorStudyVal'),
  factorStudyBar: document.getElementById('factorStudyBar'),
  factorStressVal: document.getElementById('factorStressVal'),
  factorStressBar: document.getElementById('factorStressBar'),

  // Inputs & Range Sync Pairs
  sliders: [
    {
      range: document.getElementById('range_daily_usage'),
      number: document.getElementById('avg_daily_usage_hours'),
      badge: document.getElementById('val_daily_usage'),
      suffix: ' hrs',
      decimals: 1
    },
    {
      range: document.getElementById('range_unlocks'),
      number: document.getElementById('daily_unlocks'),
      badge: document.getElementById('val_unlocks'),
      suffix: ' times',
      decimals: 0
    },
    {
      range: document.getElementById('range_study_hours'),
      number: document.getElementById('study_hours'),
      badge: document.getElementById('val_study_hours'),
      suffix: ' hrs',
      decimals: 1
    },
    {
      range: document.getElementById('range_activity_hours'),
      number: document.getElementById('physical_activity_hours'),
      badge: document.getElementById('val_activity_hours'),
      suffix: ' hrs',
      decimals: 1
    },
    {
      range: document.getElementById('range_sleep_hours'),
      number: document.getElementById('sleep_hours_per_night'),
      badge: document.getElementById('val_sleep_hours'),
      suffix: ' hrs',
      decimals: 1
    }
  ]
};

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupRangeSyncing();
  setupPresets();
  setupFormValidationAndSubmission();
  checkApiHealth();
});

// ============================================================================
// 1. Backend Connectivity & Health Check
// ============================================================================
async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
    if (res.ok) {
      elements.apiStatusDot.className = 'status-dot connected';
      elements.apiStatusText.textContent = 'API Connected';
    } else {
      elements.apiStatusDot.className = 'status-dot error';
      elements.apiStatusText.textContent = `API Error (${res.status})`;
    }
  } catch (err) {
    console.warn('API Health check warning:', err);
    elements.apiStatusDot.className = 'status-dot error';
    elements.apiStatusText.textContent = 'Backend Offline';
  }
}

// ============================================================================
// 2. Sliders & Numeric Inputs Synchronization
// ============================================================================
function setupRangeSyncing() {
  elements.sliders.forEach(item => {
    // Range -> Number & Badge
    item.range.addEventListener('input', () => {
      const val = parseFloat(item.range.value);
      item.number.value = val;
      item.badge.textContent = `${val.toFixed(item.decimals)}${item.suffix}`;
    });

    // Number -> Range & Badge
    item.number.addEventListener('input', () => {
      let val = parseFloat(item.number.value);
      if (isNaN(val)) return;

      const min = parseFloat(item.range.min);
      const max = parseFloat(item.range.max);

      // Clamp value visually for range slider
      item.range.value = Math.min(Math.max(val, min), max);
      item.badge.textContent = `${val.toFixed(item.decimals)}${item.suffix}`;
    });

    // Initialize badge
    const initialVal = parseFloat(item.number.value);
    item.badge.textContent = `${initialVal.toFixed(item.decimals)}${item.suffix}`;
  });

  // Reset button handler
  elements.resetBtn.addEventListener('click', () => {
    elements.form.reset();
    setTimeout(() => {
      elements.sliders.forEach(item => {
        item.range.value = item.number.value;
        const val = parseFloat(item.number.value);
        item.badge.textContent = `${val.toFixed(item.decimals)}${item.suffix}`;
      });
      clearErrors();
    }, 50);
  });
}

// ============================================================================
// 3. Preset Personas Application
// ============================================================================
function setupPresets() {
  const presetBtns = document.querySelectorAll('.btn-preset');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-preset');
      const data = PRESETS[presetKey];
      if (!data) return;

      applyPresetData(data);

      // Visual feedback on clicked button
      btn.style.transform = 'scale(0.96)';
      setTimeout(() => { btn.style.transform = ''; }, 150);
    });
  });
}

function applyPresetData(data) {
  // Simple fields
  document.getElementById('age').value = data.age;
  document.getElementById('country').value = data.country;
  document.getElementById('academic_level').value = data.academic_level;
  document.getElementById('most_used_platform').value = data.most_used_platform;
  document.getElementById('purpose_of_use').value = data.purpose_of_use;

  // Radios
  const genderRadio = elements.form.querySelector(`input[name="gender"][value="${data.gender}"]`);
  if (genderRadio) genderRadio.checked = true;

  const stressRadio = elements.form.querySelector(`input[name="stress_level"][value="${data.stress_level}"]`);
  if (stressRadio) stressRadio.checked = true;

  // Sliders & Numbers
  elements.sliders.forEach(item => {
    const fieldName = item.number.name;
    if (data[fieldName] !== undefined) {
      item.number.value = data[fieldName];
      item.range.value = data[fieldName];
      item.badge.textContent = `${Number(data[fieldName]).toFixed(item.decimals)}${item.suffix}`;
    }
  });

  clearErrors();
}

// ============================================================================
// 4. Form Validation and API Call
// ============================================================================
function setupFormValidationAndSubmission() {
  elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFormSubmit();
  });

  if (elements.retryBtn) {
    elements.retryBtn.addEventListener('click', () => {
      handleFormSubmit();
    });
  }
}

function clearErrors() {
  const errorElements = document.querySelectorAll('.field-error');
  errorElements.forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
}

function validatePayload(payload) {
  let isValid = true;
  clearErrors();

  if (isNaN(payload.age) || payload.age < 0 || payload.age > 100) {
    showFieldError('ageError', 'Please enter a valid age between 0 and 100.');
    isValid = false;
  }

  if (isNaN(payload.avg_daily_usage_hours) || payload.avg_daily_usage_hours < 0 || payload.avg_daily_usage_hours > 24) {
    showFieldError('usageHoursError', 'Daily usage must be between 0 and 24 hours.');
    isValid = false;
  }

  if (isNaN(payload.daily_unlocks) || payload.daily_unlocks < 0) {
    showFieldError('unlocksError', 'Daily unlocks cannot be negative.');
    isValid = false;
  }

  if (isNaN(payload.study_hours) || payload.study_hours < 0 || payload.study_hours > 24) {
    showFieldError('studyHoursError', 'Study hours must be between 0 and 24.');
    isValid = false;
  }

  if (isNaN(payload.physical_activity_hours) || payload.physical_activity_hours < 0 || payload.physical_activity_hours > 24) {
    showFieldError('activityHoursError', 'Activity hours must be between 0 and 24.');
    isValid = false;
  }

  if (isNaN(payload.sleep_hours_per_night) || payload.sleep_hours_per_night < 0 || payload.sleep_hours_per_night > 24) {
    showFieldError('sleepHoursError', 'Sleep hours must be between 0 and 24.');
    isValid = false;
  }

  return isValid;
}

function showFieldError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.classList.add('visible');
  }
}

async function handleFormSubmit() {
  // Gather Form Data matching StudentData schema
  const formData = new FormData(elements.form);

  const payload = {
    age: parseInt(formData.get('age'), 10),
    gender: formData.get('gender'),
    country: formData.get('country'),
    academic_level: formData.get('academic_level'),
    most_used_platform: formData.get('most_used_platform'),
    purpose_of_use: formData.get('purpose_of_use'),
    avg_daily_usage_hours: parseFloat(formData.get('avg_daily_usage_hours')),
    daily_unlocks: parseInt(formData.get('daily_unlocks'), 10),
    study_hours: parseFloat(formData.get('study_hours')),
    physical_activity_hours: parseFloat(formData.get('physical_activity_hours')),
    sleep_hours_per_night: parseFloat(formData.get('sleep_hours_per_night')),
    stress_level: formData.get('stress_level')
  };

  if (!validatePayload(payload)) {
    return;
  }

  // Set Loading State
  setLoading(true);

  try {
    const response = await fetch(PREDICT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMsg = `Server returned status ${response.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.detail) {
          if (Array.isArray(parsed.detail)) {
            errorMsg = parsed.detail.map(d => `${d.loc ? d.loc.join('.') : ''}: ${d.msg}`).join(', ');
          } else {
            errorMsg = parsed.detail;
          }
        }
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    console.log('Prediction received from FastAPI:', data);

    if (typeof data.mental_health_score !== 'number') {
      throw new Error('Invalid response structure: expected numeric mental_health_score');
    }

    displayPredictionResult(data.mental_health_score, payload);
    elements.apiStatusDot.className = 'status-dot connected';
    elements.apiStatusText.textContent = 'API Connected';

  } catch (error) {
    console.error('Prediction API Error:', error);
    displayError(error.message);
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  if (isLoading) {
    elements.submitBtn.disabled = true;
    elements.submitBtn.classList.add('loading');
    elements.btnText.textContent = 'Analyzing Student Data...';
  } else {
    elements.submitBtn.disabled = false;
    elements.submitBtn.classList.remove('loading');
    elements.btnText.textContent = 'Predict Mental Health';
  }
}

// ============================================================================
// 5. Display Prediction Result
// ============================================================================
function displayPredictionResult(score, inputData) {
  // Hide placeholder and error cards
  elements.initialCard.style.display = 'none';
  elements.errorCard.style.display = 'none';
  elements.resultCard.style.display = 'block';

  // Format score
  const roundedScore = Math.max(0, Math.min(10, score));

  // Animate numeric score counter
  animateScoreCounter(roundedScore);

  // Animate Gauge Progress (SVG Stroke Dashoffset)
  const offset = GAUGE_CIRCUMFERENCE - (roundedScore / 10) * GAUGE_CIRCUMFERENCE;
  elements.gaugeProgress.style.strokeDashoffset = offset;

  // Spectrum Indicator (0% to 100%)
  const percentage = Math.min(Math.max((roundedScore / 10) * 100, 2), 98);
  elements.spectrumIndicator.style.left = `${percentage}%`;

  // Determine Tier, Colors & Advice
  applyResultTierAndInsights(roundedScore, inputData);

  // Timestamp
  elements.resultTimestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Mobile scroll into view if screen is narrow
  if (window.innerWidth <= 1024) {
    elements.resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function animateScoreCounter(targetScore) {
  const duration = 800; // ms
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentVal = (targetScore * easeProgress).toFixed(2);
    elements.scoreValue.textContent = currentVal;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      elements.scoreValue.textContent = targetScore.toFixed(2);
    }
  }

  requestAnimationFrame(update);
}

function applyResultTierAndInsights(score, input) {
  const tag = elements.resultStatusTag;
  const heading = elements.resultHeading;
  const desc = elements.resultTierDesc;
  const gauge = elements.gaugeProgress;

  // Reset tag classes
  tag.className = 'result-badge-tag';

  if (score >= 7.0) {
    // Thriving / Low Risk Tier
    tag.classList.add('tier-thriving');
    tag.textContent = 'Thriving / Low Risk';
    heading.textContent = 'Healthy Mental Wellbeing Score';
    desc.textContent = 'Strong protective factors observed, including supportive sleep patterns and balanced digital habits.';
    gauge.style.stroke = 'var(--success)';
  } else if (score >= 5.0) {
    // Moderate / Stable Tier
    tag.classList.add('tier-moderate');
    tag.textContent = 'Moderate / Balanced';
    heading.textContent = 'Moderate Mental Wellbeing Score';
    desc.textContent = 'General lifestyle stability is present, with opportunities to reduce screen overload or enhance sleep recovery.';
    gauge.style.stroke = 'var(--warning)';
  } else {
    // Elevated Risk Tier
    tag.classList.add('tier-risk');
    tag.textContent = 'Elevated Risk / Distress';
    heading.textContent = 'Vulnerable Mental Wellbeing Score';
    desc.textContent = 'Elevated stress indicators detected, alongside potential sleep debt or excessive digital consumption.';
    gauge.style.stroke = 'var(--danger)';
  }

  // Update Factor Highlights Bars
  elements.factorSleepVal.textContent = `${input.sleep_hours_per_night} hrs`;
  const sleepPercent = Math.min((input.sleep_hours_per_night / 10) * 100, 100);
  elements.factorSleepBar.style.width = `${sleepPercent}%`;
  elements.factorSleepBar.style.background = input.sleep_hours_per_night >= 7 ? 'var(--success)' : 'var(--warning)';

  elements.factorMediaVal.textContent = `${input.avg_daily_usage_hours} hrs`;
  const mediaPercent = Math.min((input.avg_daily_usage_hours / 12) * 100, 100);
  elements.factorMediaBar.style.width = `${mediaPercent}%`;
  elements.factorMediaBar.style.background = input.avg_daily_usage_hours > 5 ? 'var(--danger)' : 'var(--info)';

  elements.factorStudyVal.textContent = `${input.study_hours} hrs`;
  const studyPercent = Math.min((input.study_hours / 10) * 100, 100);
  elements.factorStudyBar.style.width = `${studyPercent}%`;

  elements.factorStressVal.textContent = input.stress_level;
  const stressLevelsMap = { 'Low': 25, 'Medium': 50, 'High': 75, 'Very High': 100 };
  const stressColorsMap = { 'Low': 'var(--success)', 'Medium': '#3b82f6', 'High': 'var(--warning)', 'Very High': 'var(--danger)' };
  elements.factorStressBar.style.width = `${stressLevelsMap[input.stress_level] || 50}%`;
  elements.factorStressBar.style.background = stressColorsMap[input.stress_level] || 'var(--primary)';

  // Tailored Recommendation Text
  generatePersonalizedRecommendation(score, input);
}

function generatePersonalizedRecommendation(score, input) {
  const recommendations = [];

  if (input.sleep_hours_per_night < 6.5) {
    recommendations.push('Nighttime sleep is below recommended restorative thresholds (7-9 hours).');
  }

  if (input.avg_daily_usage_hours > 5.0 || input.daily_unlocks > 100) {
    recommendations.push(`High social media usage (${input.avg_daily_usage_hours} hrs, ${input.daily_unlocks} unlocks) may contribute to digital cognitive fatigue.`);
  }

  if (input.physical_activity_hours < 1.0) {
    recommendations.push('Incorporating at least 30-45 minutes of daily physical exercise provides proven stress-relief.');
  }

  if (input.stress_level === 'Very High' || input.stress_level === 'High') {
    recommendations.push('Reported stress is elevated. Implementing structured study breaks and mindfulness exercises is strongly encouraged.');
  }

  if (recommendations.length === 0) {
    elements.recommendationText.textContent =
      'Excellent balance across academic, digital, and rest habits! Continuing these consistent routines helps preserve long-term mental resilience.';
  } else {
    elements.recommendationText.textContent = recommendations.join(' ');
  }
}

// ============================================================================
// 6. Display Error State
// ============================================================================
function displayError(message) {
  elements.initialCard.style.display = 'none';
  elements.resultCard.style.display = 'none';
  elements.errorCard.style.display = 'block';

  elements.errorMessage.textContent = message ||
    'Could not establish connection to the FastAPI prediction endpoint. Please check if the backend server is running.';

  elements.apiStatusDot.className = 'status-dot error';
  elements.apiStatusText.textContent = 'Connection Error';
}
