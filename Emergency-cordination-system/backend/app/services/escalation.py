import asyncio
from app.config import ESCALATION_TIMEOUT_SECONDS

class EscalationService:
    # Dictionary to keep track of active escalation background tasks
    # key: alert_id, value: asyncio.Task
    active_tasks: dict[int, asyncio.Task] = {}

    @classmethod
    def schedule_escalation(cls, alert_id: int, next_step: int, timeout: int = None):
        if timeout is None:
            timeout = ESCALATION_TIMEOUT_SECONDS

        # Cancel any existing escalation task for this alert first
        cls.cancel_escalation(alert_id)

        # Schedule the new delay task
        task = asyncio.create_task(cls._escalation_delay_task(alert_id, next_step, timeout))
        cls.active_tasks[alert_id] = task
        print(f"[EscalationService] Scheduled step {next_step} for alert {alert_id} in {timeout}s.")

    @classmethod
    def cancel_escalation(cls, alert_id: int):
        task = cls.active_tasks.pop(alert_id, None)
        if task:
            task.cancel()
            print(f"[EscalationService] Cancelled pending escalation task for alert {alert_id}.")

    @classmethod
    async def _escalation_delay_task(cls, alert_id: int, next_step: int, timeout: int):
        try:
            await asyncio.sleep(timeout)
            # Remove task from active tracker since it's firing
            cls.active_tasks.pop(alert_id, None)
            
            from app.database import SessionLocal
            with SessionLocal() as db:
                from app.services.alert_routing import AlertRoutingService
                await AlertRoutingService.escalate(db, alert_id, next_step)
        except asyncio.CancelledError:
            # Task was cancelled
            pass
        except Exception as e:
            print(f"[EscalationService] Error in background escalation task: {e}")
