# External AI service contract

The Python model is deliberately not implemented in this backend task. Express calls the configured service's `POST /predict-price` endpoint. See backend documentation for request/response validation and failure isolation.

Request (JSON):

```json
{
  "product": "Fresh Tomatoes",
  "category": "Vegetables",
  "district": "Vavuniya",
  "quality": "Grade A",
  "quantity": 50,
  "unit": "kg",
  "harvestDate": "2026-09-25",
  "month": 9
}
```

Successful response (JSON; LKR per requested unit):

```json
{
  "recommendedPrice": 340,
  "minimumPrice": 320,
  "maximumPrice": 360,
  "confidence": "Medium"
}
```

The numbers above illustrate the contract; they are not real predictions. Prices must be finite, positive, at most 10,000,000 and ordered minimum ≤ recommended ≤ maximum. Confidence must be `Low`, `Medium` or `High`. The model provider is responsible for the meaning and calibration of its confidence label.

Express calls only the configured `AI_SERVICE_URL`, enforces a timeout and rejects redirects. It strips additional response properties and never sends a browser token to the model. The browser calls Express, never Python directly. An unavailable or malformed service produces a controlled 503 while manual pricing remains available. See [backend setup](../backend/README.md).
