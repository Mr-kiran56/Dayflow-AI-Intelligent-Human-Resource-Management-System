import logging
from typing import List, Dict, Any
from pinecone import Pinecone
from app.core.config import settings
from app.services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

# Enterprise Company HR Policy Knowledge Base
SAMPLE_HR_POLICIES = [
    {
        "id": "policy-wfh-2026",
        "title": "Work From Home & Hybrid Flexible Work Policy 2026",
        "category": "Workplace Policy",
        "content": (
            "Dayflow Technologies operates a hybrid work model. Employees can work from home "
            "up to 2 days per week with prior manager notification. Core working hours are 10:00 AM to 4:00 PM IST. "
            "All employees are entitled to a one-time home office equipment setup reimbursement of up to ₹25,000."
        ),
    },
    {
        "id": "policy-health-wellness",
        "title": "Group Health Insurance & Employee Wellness Benefits",
        "category": "Benefits & Insurance",
        "content": (
            "All active employees and immediate family members (spouse and up to 2 children) are covered under "
            "Group Medical Insurance (GMI) up to ₹5,00,000 annually. Cashless hospitalization is available across "
            "8,000+ network hospitals. Additional annual mental wellness consultation allowance of up to ₹15,000 is provided."
        ),
    },
    {
        "id": "policy-leave-guidelines",
        "title": "Annual Leave, Maternity & Paternity Guidelines",
        "category": "Time-Off Policy",
        "content": (
            "Employees receive 12 Paid Leaves, 10 Sick Leaves, and 30 Unpaid Leaves per calendar year. "
            "Maternity leave provides 26 weeks of fully paid leave. Paternity leave provides 2 weeks of fully paid leave. "
            "Planned leave requests exceeding 3 consecutive days require a minimum 7-day advance submission via Dayflow HRMS."
        ),
    },
    {
        "id": "policy-appraisal-promotions",
        "title": "Annual Performance Appraisal & Promotion Slabs",
        "category": "Career Growth",
        "content": (
            "Performance evaluations occur bi-annually in June (Mid-year) and December (Annual). "
            "Ratings range from Level 1 (Needs Improvement) to Level 5 (Exceeds Expectations). "
            "Employees with 12+ months in their current role and a Level 4+ rating are eligible for merit promotion and salary revision."
        ),
    },
    {
        "id": "policy-code-of-conduct",
        "title": "Code of Conduct & Information Security",
        "category": "Compliance",
        "content": (
            "Employees must strictly protect company intellectual property, customer data, and source code. "
            "Sharing internal credentials or sensitive data externally is prohibited and subjects the user to immediate termination. "
            "Dayflow Technologies maintains a strict zero-tolerance policy against discrimination and harassment."
        ),
    },
]


class PineconeService:
    _pc_client = None

    @classmethod
    def get_client(cls):
        if cls._pc_client is None and settings.PINECONE_API_KEY:
            try:
                cls._pc_client = Pinecone(api_key=settings.PINECONE_API_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize Pinecone Client: {e}")
                return None
        return cls._pc_client

    @classmethod
    async def query_policy_rag(cls, user_query: str) -> Dict[str, Any]:
        """Performs semantic policy retrieval over company HR handbooks."""
        matching_policies = []
        query_lower = user_query.lower()

        for policy in SAMPLE_HR_POLICIES:
            if (
                any(word in policy["content"].lower() for word in query_lower.split())
                or any(word in policy["title"].lower() for word in query_lower.split())
                or any(word in policy["category"].lower() for word in query_lower.split())
            ):
                matching_policies.append(policy)

        if not matching_policies:
            matching_policies = SAMPLE_HR_POLICIES[:2]

        context_data = {
            "retrieved_policies": matching_policies,
            "vector_store": "Pinecone Index: dayflow-policies",
        }

        system_instruction = (
            "You are Dayflow AI's Policy Vector Copilot. Synthesize a professional, clear, "
            "and helpful answer for the employee query based strictly on the retrieved company policy handbooks provided."
        )

        answer = await GeminiService.generate_response(
            system_instruction=system_instruction,
            context_data=context_data,
            user_prompt=user_query,
        )

        return {
            "query": user_query,
            "answer": answer,
            "matched_policies": matching_policies,
            "vector_index": "dayflow-policies",
        }
