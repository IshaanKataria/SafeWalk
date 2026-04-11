from fastapi import APIRouter

from app.schemas.scoring import ScoreSegmentRequest, ScoreSegmentResponse
from app.services.scorer_selector import score_segment

router = APIRouter(prefix="/api", tags=["scoring"])


@router.post("/score-segment", response_model=ScoreSegmentResponse)
def score_segment_endpoint(request: ScoreSegmentRequest):
    result = score_segment(request.lat, request.lng, request.time_of_day)
    return ScoreSegmentResponse(**result)
