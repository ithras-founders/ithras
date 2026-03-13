"""
Simulator scenarios — multi-step business-flow runners.

Each scenario is a class that inherits from BaseScenario and implements
`define_steps()`.  The ScenarioRunner executes them, recording per-step
status, timing, and created entity IDs.
"""

from .base import BaseScenario, ScenarioRunner, ScenarioStep
from .application_flow import ApplicationFlowScenario
from .jd_submission_flow import JDSubmissionFlowScenario
from .governance_flow import GovernanceFlowScenario
from .offer_flow import OfferFlowScenario
from .cycle_management_flow import CycleManagementFlowScenario

SCENARIOS = {
    "application_flow": ApplicationFlowScenario,
    "jd_submission_flow": JDSubmissionFlowScenario,
    "governance_flow": GovernanceFlowScenario,
    "offer_flow": OfferFlowScenario,
    "cycle_management_flow": CycleManagementFlowScenario,
}

__all__ = [
    "BaseScenario",
    "ScenarioRunner",
    "ScenarioStep",
    "SCENARIOS",
    "ApplicationFlowScenario",
    "JDSubmissionFlowScenario",
    "GovernanceFlowScenario",
    "OfferFlowScenario",
    "CycleManagementFlowScenario",
]
